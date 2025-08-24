import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import TourForm from '../../components/TourForm'

export default function CreateTour() {
  const [guideId, setGuideId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchGuideId() {
      try {
        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError
        
        if (!userData.user) {
          throw new Error('Not authenticated')
        }

        // Get guide ID from guides table
        const { data: guideData, error: guideError } = await supabase
          .from('guides')
          .select('id')
          .eq('user_id', userData.user.id)
          .single()
        
        if (guideError) {
          if (guideError.code === 'PGRST116') {
            throw new Error('Guide profile not found. Are you registered as a guide?')
          }
          throw guideError
        }

        setGuideId(guideData.id)
      } catch (err: any) {
        console.error('Error fetching guide info:', err)
        setError(err.message || 'Failed to load guide information')
      } finally {
        setLoading(false)
      }
    }

    fetchGuideId()
  }, [])

  function handleTourCreated(tourId: string) {
    // Redirect to tour page
    navigate(`/tour/${tourId}`)
  }

  if (loading) return <div>Loading...</div>
  
  if (error) {
    return <div className="bg-red-100 text-red-700 p-4 rounded">{error}</div>
  }

  if (!guideId) {
    return <div>No guide profile found. Please create a guide profile first.</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Create a New Tour</h2>
      <TourForm guideId={guideId} onSuccess={handleTourCreated} />
    </div>
  )
}