import React from 'react'
import TourCard from '../components/TourCard'
import tours from '../data/tours.json'
import { Tour } from '../types'

export default function Home() {
  const featuredTours: Tour[] = tours.slice(0, 3)

  return (
    <div>
      <section className="py-8 text-center">
        <h1 className="text-4xl font-bold">Discover experiences with local guides</h1>
        <p className="mt-3 text-gray-600">Find curated tours, book with confidence, and explore locally.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Featured tours</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredTours.map((t) => (
            <TourCard key={t.id} tour={t} />
          ))}
        </div>
      </section>
    </div>
  )
}
