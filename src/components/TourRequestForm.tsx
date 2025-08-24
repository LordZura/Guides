import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface TourRequestFormProps {
  guideId: string;
  tourId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TourRequestForm({ 
  guideId, 
  tourId, 
  onSuccess, 
  onCancel 
}: TourRequestFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [groupSize, setGroupSize] = useState(1);
  const [budgetMin, setBudgetMin] = useState<number | undefined>();
  const [budgetMax, setBudgetMax] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if user is logged in
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('You must be logged in to make a request');
      
      const touristId = userData.user?.id;
      if (!touristId) throw new Error('You must be logged in to make a request');

      // Create the tour request
      const { data: requestData, error: requestError } = await supabase
        .from('tour_requests')
        .insert([
          {
            tourist_id: touristId,
            guide_id: guideId,
            tour_id: tourId || null,
            title,
            description,
            start_date: startDate ? new Date(startDate).toISOString() : null,
            end_date: endDate ? new Date(endDate).toISOString() : null,
            status: 'pending',
            group_size: groupSize,
            budget_min: budgetMin,
            budget_max: budgetMax,
          }
        ])
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // Create a conversation for this request
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          {
            tour_request_id: requestData.id,
            title: `Request: ${title}`,
          }
        ])
        .select()
        .single();
      
      if (conversationError) throw conversationError;
      
      // Add both users as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationData.id, user_id: touristId },
          { conversation_id: conversationData.id, user_id: guideId }
        ]);
        
      if (participantsError) throw participantsError;
      
      // Add initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationData.id,
            sender_id: touristId,
            content: description
          }
        ]);
        
      if (messageError) throw messageError;
      
      // Call success callback
      if (onSuccess) onSuccess();
      
    } catch (err: any) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit your request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Request a Tour</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title/Subject
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="E.g., City tour for family of 4"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
            rows={4}
            placeholder="Describe what you're looking for, your interests, and any special requirements"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Size
            </label>
            <input
              type="number"
              min="1"
              value={groupSize}
              onChange={(e) => setGroupSize(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Min ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={budgetMin || ''}
              onChange={(e) => setBudgetMin(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Max ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={budgetMax || ''}
              onChange={(e) => setBudgetMax(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border rounded"
              placeholder="Optional"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}