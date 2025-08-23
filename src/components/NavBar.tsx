import React from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">
          TourGuideHub
        </Link>
        <div className="space-x-4">
          <Link to="/explore" className="hover:underline">
            Explore
          </Link>
          <Link to="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link to="/login" className="hover:underline">
            Log in
          </Link>
          <Link to="/signup" className="px-3 py-1 rounded bg-blue-600 text-white text-sm">
            Sign up
          </Link>
        </div>
      </div>
    </nav>
  )
}
