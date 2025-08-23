import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-8">
      <div className="container mx-auto px-4 py-6 text-sm text-gray-600">
        © {new Date().getFullYear()} TourGuideHub — built with ❤️
      </div>
    </footer>
  )
}
