import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // Optionally add redirect URL for client to handle password update flow:
        // redirectTo: 'https://your-app.example.com/reset-password'
      })
      if (error) throw error
      setStatus('Password reset email sent. Check your inbox.')
    } catch (err: any) {
      console.error('reset error', err)
      setStatus(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Reset password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading} type="submit">
            {loading ? 'Sending...' : 'Send reset email'}
          </button>
        </div>
      </form>
      {status && <div className="mt-4 text-sm">{status}</div>}
    </div>
  )
}