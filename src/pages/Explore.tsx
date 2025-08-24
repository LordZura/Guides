import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TourCard from '../components/TourCard'
import { Tour } from '../types'

// Updated type to match Supabase's actual return format for joins
type ExploreTourRow = {
  id: string
  title: string
  description: string
  price_avg: number
  guide_id: string
  photos: string[]
  guides: {
    user_id: string
    users: {
      display_name: string
    } | null
  } | null
}

export default function Explore() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const perPage = 9

  useEffect(() => {
    fetchTours()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function fetchTours() {
    setLoading(true)
    try {
      // Calculate range for pagination
      const from = (page - 1) * perPage
      const to = from + perPage - 1

      // Correct select syntax for Supabase nested joins
      const { data, error, count } = await supabase
        .from('tours')
        .select(`
          id,
          title,
          description,
          price_avg,
          guide_id,
          photos,
          guides (
            user_id,
            users (
              display_name
            )
          )
        `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data) return

      // Use type assertion with unknown first to safely convert
      const typedData = data as unknown as ExploreTourRow[]

      // Format for TourCard
      const formattedTours: Tour[] = typedData.map(tour => ({
        id: tour.id,
        title: tour.title,
        shortDescription: tour.description.length > 120
          ? tour.description.substring(0, 120) + '...'
          : tour.description,
        priceUSD: Number(tour.price_avg) || 0,
        guideName: tour.guides?.users?.display_name || 'Tour Guide',
        guideId: tour.guide_id,
        image: tour.photos?.[0] || undefined,
      }))

      setTours(formattedTours)
      setHasMore(count !== null && from + formattedTours.length < count)
    } catch (error) {
      console.error('Error fetching tours:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Explore Tours</h1>
      
      {loading && page === 1 ? (
        <p>Loading tours...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tours.map(tour => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          
          {tours.length === 0 && (
            <p className="text-center py-10 text-gray-500">No tours found</p>
          )}
          
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className={`px-4 py-2 rounded ${
                page === 1 || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white'
              }`}
            >
              Previous
            </button>
            
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
              className={`px-4 py-2 rounded ${
                !hasMore || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 text-white'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}