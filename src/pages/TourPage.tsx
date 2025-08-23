import React from 'react'
import { useParams } from 'react-router-dom'
import tours from '../data/tours.json'

export default function TourPage() {
  const { id } = useParams()
  const tour = tours.find((t) => t.id === id)

  if (!tour) return <div>Tour not found</div>

  return (
    <div>
      <h1 className="text-2xl font-semibold">{tour.title}</h1>
      <p className="mt-2 text-gray-700">{tour.shortDescription}</p>
      <div className="mt-4">Price: ${tour.priceUSD}</div>
      <div className="mt-4">Guide: {tour.guideName}</div>
      <div className="mt-6">
        <button className="px-4 py-2 bg-green-600 text-white rounded">Request booking (TODO)</button>
      </div>
    </div>
  )
}
