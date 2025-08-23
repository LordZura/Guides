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
      // 1) Sign up with Supabase Auth (v2)
      const { data: signData, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // add basic metadata to auth.user if you'd like
          data: { display_name: displayName }
        }
      })
      if (signError) throw signError

      // user id from the auth system
      const userId = signData?.user?.id
      if (!userId) {
        // In some Supabase configurations email confirmations are required
        // and user object might not be available immediately — we still try
        // to continue if user id is present; otherwise surface a friendly message.
        throw new Error('Could not obtain user id after sign up. Please check your email for confirmation link and then login.')
      }

      // 2) Insert into public.users table your app-level user profile
      const { error: insertUserError } = await supabase
        .from('users')
        .insert([{ id: userId, email, display_name: displayName, role }])

      if (insertUserError) throw insertUserError

      // 3) Create corresponding row in guides or tourists table
      if (role === 'guide') {
        const { error: gerr } = await supabase
          .from('guides')
          .insert([{ user_id: userId, bio: '', languages: [], photos: [] }])
        if (gerr) throw gerr
      } else {
        const { error: terr } = await supabase
          .from('tourists')
          .insert([{ user_id: userId, bio: '', languages: [], photos: [] }])
        if (terr) throw terr
      }

      // 4) Optionally sign the user in automatically or redirect to dashboard
      // If email confirmation is required, the user will need to verify email first.
      // We'll try to sign in automatically (may or may not succeed depending on confirmation settings).
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (signInError) {
        // Not fatal — user may need to confirm email. Let them know and redirect to login.
        alert('Signup successful. Please confirm your email if required, then log in.')
        navigate('/login')
      } else {
        // Successful sign-in; redirect to dashboard
        navigate('/dashboard')
      }
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
