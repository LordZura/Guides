import React, { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { uploadGuidePhotos } from '../../utils/supabaseStorage'

export default function GuideProfile() {
  const [bio, setBio] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [avgPrice, setAvgPrice] = useState<number>(0)
  const [serviceLocations, setServiceLocations] = useState<string[]>([])
  const [gallery, setGallery] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Get current user ID using Supabase v2
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) return console.error(error)
      setUserId(data.user?.id ?? null)
    }
    fetchUser()
  }, [])

  // Fetch guide info
  useEffect(() => {
    if (!userId) return
    const fetchGuide = async () => {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error) return console.error(error)
      setBio(data.bio)
      setLanguages(data.languages || [])
      setAvgPrice(data.avg_price)
      setServiceLocations(data.service_locations || [])
      setExistingPhotos(data.photos || [])
    }
    fetchGuide()
  }, [userId])

  const handleSave = async () => {
    if (!userId) return
    setLoading(true)
    try {
      let uploadedUrls: string[] = []
      if (gallery.length > 0) {
        uploadedUrls = await uploadGuidePhotos(userId, gallery)
      }

      const { error } = await supabase
        .from('guides')
        .update({
          bio,
          languages,
          avg_price: avgPrice,
          service_locations: serviceLocations,
          photos: [...existingPhotos, ...uploadedUrls],
        })
        .eq('user_id', userId)

      if (error) throw error
      alert('Profile saved!')
      setExistingPhotos(prev => [...prev, ...uploadedUrls])
      setGallery([])
    } catch (err: any) {
      alert('Error saving profile: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Guide Profile</h2>

      <div>
        <label>Bio</label>
        <textarea
          className="w-full border p-2"
          value={bio}
          onChange={e => setBio(e.target.value)}
        />
      </div>

      <div>
        <label>Languages (comma separated)</label>
        <input
          className="w-full border p-2"
          value={languages.join(',')}
          onChange={e =>
            setLanguages(e.target.value.split(',').map(s => s.trim()))
          }
        />
      </div>

      <div>
        <label>Average Price</label>
        <input
          type="number"
          className="border p-2"
          value={avgPrice}
          onChange={e => setAvgPrice(Number(e.target.value))}
        />
      </div>

      <div>
        <label>Service Locations (comma separated)</label>
        <input
          className="w-full border p-2"
          value={serviceLocations.join(',')}
          onChange={e =>
            setServiceLocations(e.target.value.split(',').map(s => s.trim()))
          }
        />
      </div>

      <div>
        <label>Gallery Upload</label>
        <input
          type="file"
          multiple
          onChange={e => setGallery(Array.from(e.target.files || []))}
        />
        <div className="flex space-x-2 mt-2">
          {existingPhotos.map(url => (
            <img key={url} src={url} className="w-20 h-20 object-cover" />
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}
