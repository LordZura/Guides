-- Add RLS policy to allow viewing profiles when they are actors in notifications
-- This allows the notification system to fetch actor profile data

CREATE POLICY "Allow viewing profiles for notification actors" 
  ON public.profiles 
  FOR SELECT 
  USING (
    -- Allow if the profile is being accessed as an actor in a notification
    -- where the current user is the recipient
    EXISTS (
      SELECT 1 
      FROM public.notifications 
      WHERE notifications.actor_id = profiles.id 
        AND notifications.recipient_id = auth.uid()
    )
  );