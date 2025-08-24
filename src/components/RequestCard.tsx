// RequestCard.tsx (updated)
import React from 'react';
import { Link } from 'react-router-dom';

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  startDate?: string | null;
  endDate?: string | null;
  userName: string; // guide or tourist name
  userRole: 'guide' | 'tourist';
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function RequestCard({
  id,
  title,
  description,
  status,
  createdAt,
  startDate,
  endDate,
  userName,
  userRole,
  onAccept,
  onDecline
}: RequestCardProps) {
  // Format date for display — accept null as well
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not specified';
    // At this point dateString is a non-empty string
    return new Date(dateString).toLocaleDateString();
  };
  
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-lg">{title}</h3>
          <span 
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mt-1">
          With {userRole === 'guide' ? 'Tourist' : 'Guide'}: {userName}
        </p>
        
        <p className="text-sm mt-2 line-clamp-2">{description}</p>
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Start:</span> {formatDate(startDate)}
          </div>
          <div>
            <span className="text-gray-500">End:</span> {formatDate(endDate)}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between">
        <div className="text-xs text-gray-500">
          Requested on {new Date(createdAt).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          {status === 'pending' && userRole === 'guide' && (
            <>
              <button 
                onClick={onDecline}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
              >
                Decline
              </button>
              <button 
                onClick={onAccept}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Accept
              </button>
            </>
          )}
          
          <Link 
            to={`/dashboard/requests/${id}`}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
