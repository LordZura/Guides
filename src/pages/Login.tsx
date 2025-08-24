import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      // 2. Get user ID
      const userId = data.user?.id
      if (!userId) throw new Error('Could not get user id after login')

      // 3. Check if profile exists
      const { data: userRow, error: userRowError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (userRowError && userRowError.code === 'PGRST116') {
        // No profile exists yet, create it now
        
        // Get info from auth metadata or local storage
        let displayName = data.user?.user_metadata?.display_name || ''
        let role: 'guide' | 'tourist' = 
          (data.user?.user_metadata?.pending_role as any) || 'tourist'
        
        // Try to get from localStorage if available (from signup)
        const pendingData = localStorage.getItem('pendingSignup')
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData)
            if (parsed.email === email) {
              displayName = parsed.display_name || displayName
              role = parsed.role || role
            }
          } catch (e) {
            console.error('Error parsing pending signup data', e)
          }
        }
        
        // First, insert into users table
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: email,
            display_name: displayName,
            role: role
          }])
        
        if (insertError) throw insertError
        
        // Then create role-specific record
        if (role === 'guide') {
          const { error: roleError } = await supabase
            .from('guides')
            .insert([{ user_id: userId }])
          if (roleError) throw roleError
        } else {
          const { error: roleError } = await supabase
            .from('tourists')
            .insert([{ user_id: userId }])
          if (roleError) throw roleError
        }
        
        // Clear pending data
        localStorage.removeItem('pendingSignup')
      }

      // Success - redirect to dashboard
      navigate('/dashboard')
      
    } catch (err: any) {
      console.error('Login error', err)
      alert(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-semibold">Log in</h2>
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex items-center justify-between">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <a className="text-sm hover:underline" href="/forgot-password">Forgot?</a>
        </div>
      </form>
    </div>
  )
}