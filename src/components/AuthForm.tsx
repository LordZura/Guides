import React, { useState } from 'react'

type Props = {
  mode: 'login' | 'signup'
  onSubmit?: (data: { email: string; password: string }) => void
}

export default function AuthForm({ mode, onSubmit }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      alert('Please provide both email and password.')
      return
    }
    onSubmit?.({ email, password })
  }

  return (
    <form onSubmit={submit} className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-semibold">{mode === 'login' ? 'Log in' : 'Create account'}</h2>
      <div>
        <label className="block text-sm">Email</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </div>
    </form>
  )
}
