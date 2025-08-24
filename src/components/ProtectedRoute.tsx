import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let mounted = true
    async function check() {
      setLoading(true)
      // Use getUser() to revalidate via the Auth server
      const { data, error } = await supabase.auth.getUser()
      if (!mounted) return
      if (error || !data?.user) {
        setAuthed(false)
      } else {
        setAuthed(true)
      }
      setLoading(false)
    }
    check()
    // subscribe to auth changes to update UI in real-time
    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      check()
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div>Loading...</div>
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}