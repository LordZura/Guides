import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

type DetailedTour = {
  id: string
  title: string
  description: string
  price_avg: number
  languages: string[]
  location_name: string
  location_lat: number | null
  location_lng: number | null
  photos: string[]
  capacity: number
  start_time: string | null
  end_time: string | null
  guide: {
    id: string
    user_id: string
    display_name: string
  } | null
}

export default function TourPage() {
  const { id } = useParams()
  const [tour, setTour] = useState<DetailedTour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check login status
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      setIsLoggedIn(!!data.user)
    }
    checkAuth()

    // Fetch tour details
    const fetchTour = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('tours')
          .select(`
            *,
            guide:guides(
              id,
              user_id,
              users(display_name)
            )
          `)
          .eq('id', id)
          .single()
        
        if (error) throw error
        
        // Format for component use
        setTour({
          ...data,
          guide: data.guide ? {
            id: data.guide.id,
            user_id: data.guide.user_id,
            display_name: data.guide.users?.display_name || 'Tour Guide'
          } : null
        })
      } catch (err: any) {
        console.error('Error fetching tour:', err)
        setError(err.message || 'Error loading tour details')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTour()
  }, [id])

  if (loading) return <div>Loading tour details...</div>
  
  if (error || !tour) {
    return <div className="text-red-500">Error: {error || 'Tour not found'}</div>
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{tour.title}</h1>
      
      {/* Photo Gallery */}
      {tour.photos.length > 0 ? (
        <div className="mb-6">
          <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg mb-2">
            <img 
              src={tour.photos[activePhoto]} 
              alt={tour.title} 
              className="w-full h-64 object-cover"
            />
          </div>
          
          {tour.photos.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {tour.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Tour photo ${idx + 1}`}
                  className={`w-20 h-20 object-cover cursor-pointer rounded ${
                    idx === activePhoto ? 'border-2 border-blue-500' : ''
                  }`}
                  onClick={() => setActivePhoto(idx)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-200 h-64 flex items-center justify-center rounded-lg mb-6">
          <p className="text-gray-500">No photos available</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-2">About this tour</h2>
          <p className="whitespace-pre-line">{tour.description}</p>
          
          {tour.languages.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium">Languages</h3>
              <p>{tour.languages.join(', ')}</p>
            </div>
          )}
          
          {tour.location_name && (
            <div className="mt-4">
              <h3 className="font-medium">Location</h3>
              <p>{tour.location_name}</p>
              
              {/* Map placeholder - in a real app you'd integrate an actual map */}
              {tour.location_lat && tour.location_lng && (
                <div className="mt-2 bg-gray-200 h-40 rounded flex items-center justify-center">
                  <p className="text-sm text-gray-600">
                    Map showing location at {tour.location_lat.toFixed(6)}, {tour.location_lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {(tour.start_time || tour.end_time) && (
            <div className="mt-4">
              <h3 className="font-medium">Schedule</h3>
              <p>
                {tour.start_time && `Starts: ${formatTime(tour.start_time)}`}
                {tour.start_time && tour.end_time && ' • '}
                {tour.end_time && `Ends: ${formatTime(tour.end_time)}`}
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded">
          <div className="text-xl font-bold">${tour.price_avg}</div>
          <div className="text-sm text-gray-600 mb-4">per person</div>
          
          {tour.capacity > 1 && (
            <div className="mb-4 text-sm">
              <span className="font-medium">Group size:</span> Up to {tour.capacity} people
            </div>
          )}
          
          {tour.guide && (
            <div className="mb-4">
              <div className="text-sm text-gray-600">Guide</div>
              <div className="font-medium">{tour.guide.display_name}</div>
            </div>
          )}
          
          <button
            className={`w-full py-2 px-4 rounded text-white ${
              isLoggedIn ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={!isLoggedIn}
            onClick={() => alert('Booking feature not implemented yet')}
          >
            Request Booking
          </button>
          
          {!isLoggedIn && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please log in to book this tour
            </p>
          )}
        </div>
      </div>
    </div>
  )
}