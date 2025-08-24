import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'guide' | 'tourist'>('tourist')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // STEP 1: ONLY create auth user - don't try to insert profile yet
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            display_name: displayName,
            pending_role: role // Store role preference in metadata
          }
        }
      })
      
      if (error) throw error
      
      // STEP 2: Store signup details in localStorage for retrieval on first login
      localStorage.setItem('pendingSignup', JSON.stringify({
        email,
        display_name: displayName,
        role
      }))
      
      // STEP 3: Inform user of next steps
      alert('Account created! Please check your email for confirmation (if required), then log in to complete your profile setup.')
      navigate('/login')
      
    } catch (err: any) {
      console.error('Signup error:', err)
      alert(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Display name</label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm">Password</label>
          <input
            required
            minLength={6}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <div className="text-sm mb-2">Role</div>
          <label className="mr-4">
            <input
              type="radio"
              name="role"
              checked={role === 'tourist'}
              onChange={() => setRole('tourist')}
            />{' '}
            Tourist
          </label>
          <label>
            <input
              type="radio"
              name="role"
              checked={role === 'guide'}
              onChange={() => setRole('guide')}
            />{' '}
            Guide
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  )
}