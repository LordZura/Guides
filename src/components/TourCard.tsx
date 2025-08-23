import React from 'react'
import { Link } from 'react-router-dom'
import { Tour } from '../types'

export default function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm flex flex-col">
      <div className="flex-1">
        <h3 className="text-lg font-semibold">{tour.title}</h3>
        <p className="text-sm text-gray-600 mt-2">{tour.shortDescription}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Guide</div>
          <div className="text-sm font-medium">{tour.guideName || 'Local guide'}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">From</div>
          <div className="text-lg font-bold">${tour.priceUSD}</div>
        </div>
      </div>

      <div className="mt-4">
        <Link
          to={`/tour/${encodeURIComponent(tour.id)}`}
          className="inline-block px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          View tour
        </Link>
      </div>
    </div>
  )
}
