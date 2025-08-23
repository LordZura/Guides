import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import GuideProfile from './Dashboard/GuideProfile'

type UserRole = 'guide' | 'tourist' | null

export default function Dashboard() {
  const [role, setRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        const userId = authData.user?.id
        if (!userId) throw new Error('User not logged in')

        // Fetch role from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()
        if (userError) throw userError

        setRole(userData.role)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  if (loading) return <p>Loading dashboard...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {role === 'guide' && (
        <>
          <p className="mt-2 text-gray-600">Guide dashboard</p>
          <GuideProfile />
        </>
      )}

      {role === 'tourist' && (
        <p className="mt-2 text-gray-600">
          Tourist dashboard — feature not implemented yet
        </p>
      )}

      {role === null && (
        <p className="mt-2 text-red-500">
          Could not determine your role — are you logged in?
        </p>
      )}
    </div>
  )
}
