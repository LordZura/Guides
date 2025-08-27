-- Create notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('booking_created', 'booking_paid', 'booking_completed', 'tour_rated', 'tour_updated', 'tour_cancelled')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who triggered the notification
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User who should receive the notification
  target_type TEXT NOT NULL CHECK (target_type IN ('booking', 'tour', 'user')),
  target_id UUID NOT NULL, -- ID of the booking, tour, or user being referenced
  message TEXT NOT NULL,
  action_url TEXT, -- Optional URL to navigate to when notification is clicked
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Set up RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Create policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = recipient_id);

-- Create policy for system to create notifications
CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true); -- We'll handle this in application logic

-- Create indexes for performance
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_target ON public.notifications(target_type, target_id);