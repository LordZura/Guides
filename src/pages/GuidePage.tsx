import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useParams } from 'react-router-dom'

export default function GuidePage() {
  const { id } = useParams()
  const [guide, setGuide] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const fetchGuide = async () => {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('user_id', id)
        .single()
      if (error) return console.error(error)
      setGuide(data)
    }
    fetchGuide()
  }, [id])

  if (!guide) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{guide.display_name || 'Guide'}</h2>
      <p>{guide.bio}</p>
      <p>Languages: {guide.languages?.join(', ')}</p>
      <p>Avg Price: ${guide.avg_price}</p>
      <p>Locations: {guide.service_locations?.join(', ')}</p>

      <div className="flex space-x-2 overflow-x-auto">
        {guide.photos?.map((url: string) => (
          <img key={url} src={url} className="w-40 h-40 object-cover" />
        ))}
      </div>

      <button className="px-4 py-2 bg-blue-500 text-white">
        Contact Guide
      </button>
    </div>
  )
}
