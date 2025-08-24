import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { uploadTourPhotos } from '../utils/supabaseStorage'

type TourFormProps = {
  guideId: string
  onSuccess?: (tourId: string) => void
}

export default function TourForm({ guideId, onSuccess }: TourFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priceAvg, setPriceAvg] = useState<number>(0)
  const [languages, setLanguages] = useState<string[]>([])
  const [locationName, setLocationName] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [capacity, setCapacity] = useState<number>(1)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!title || !description || priceAvg <= 0) {
        throw new Error('Please fill in all required fields')
      }

      // 1. Create tour record first
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .insert([
          {
            guide_id: guideId,
            title,
            description,
            price_avg: priceAvg,
            languages,
            location_name: locationName,
            location_lat: lat,
            location_lng: lng,
            capacity,
            start_time: startTime || null,
            end_time: endTime || null
          }
        ])
        .select()

      if (tourError) throw tourError

      const tourId = tourData?.[0]?.id
      if (!tourId) throw new Error('Failed to get tour ID after creation')

      // 2. Upload photos if any
      if (photos.length > 0) {
        const photoUrls = await uploadTourPhotos(tourId, photos)

        // 3. Update tour with photo URLs
        const { error: updateError } = await supabase
          .from('tours')
          .update({ photos: photoUrls })
          .eq('id', tourId)

        if (updateError) throw updateError
      }

      // Success!
      alert('Tour created successfully!')
      onSuccess?.(tourId)
      
      // Reset form
      setTitle('')
      setDescription('')
      setPriceAvg(0)
      setLanguages([])
      setLocationName('')
      setLat(null)
      setLng(null)
      setCapacity(1)
      setStartTime('')
      setEndTime('')
      setPhotos([])
      
    } catch (err: any) {
      console.error('Error creating tour:', err)
      setError(err.message || 'Failed to create tour')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium">Title*</label>
        <input
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description*</label>
        <textarea
          className="w-full border rounded p-2 min-h-[100px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Average Price ($)*</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full border rounded p-2"
            value={priceAvg}
            onChange={(e) => setPriceAvg(Number(e.target.value))}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Capacity</label>
          <input
            type="number"
            min="1"
            className="w-full border rounded p-2"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Languages (comma separated)</label>
        <input
          className="w-full border rounded p-2"
          value={languages.join(',')}
          onChange={(e) => setLanguages(e.target.value.split(',').map((l) => l.trim()))}
          placeholder="English, Spanish, etc."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Location Name</label>
        <input
          className="w-full border rounded p-2"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="City Center, Historic District, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Latitude</label>
          <input
            type="number"
            step="0.000001"
            className="w-full border rounded p-2"
            value={lat || ''}
            onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. 41.8781"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Longitude</label>
          <input
            type="number"
            step="0.000001"
            className="w-full border rounded p-2"
            value={lng || ''}
            onChange={(e) => setLng(e.target.value ? Number(e.target.value) : null)}
            placeholder="e.g. -87.6298"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Start Time</label>
          <input
            type="time"
            className="w-full border rounded p-2"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">End Time</label>
          <input
            type="time"
            className="w-full border rounded p-2"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Photos</label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full border rounded p-2"
          onChange={(e) => setPhotos(Array.from(e.target.files || []))}
        />
        {photos.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">{photos.length} files selected</p>
        )}
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Creating...' : 'Create Tour'}
        </button>
      </div>
    </form>
  )
}