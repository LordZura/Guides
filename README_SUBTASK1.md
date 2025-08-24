# TourGuideHub - Subtask 1: Auth System & Registration

This readme contains instructions for running and testing the authentication system and user registration flow implemented in Subtask 1.

## Features Implemented

- User authentication (sign up, sign in, sign out) using Supabase Auth
- Profile creation with role selection (Guide or Tourist)
- Dynamic navigation bar based on authentication status
- Protected routes for authenticated users
- Basic dashboard showing user profile information
- Placeholder Explore page with tabs

## Prerequisites

- Node.js 14+ and npm
- Supabase account and project

## Environment Setup

1. Create a `.env.local` file in the project root with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** Never commit this file or share these keys publicly.

## Database Setup

1. Run the SQL migration in `src/db/migrations/001_create_profiles.sql` in your Supabase SQL editor.
2. This creates the `profiles` table with proper relationships to `auth.users` and sets up Row Level Security policies.

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5173/`.

## Quick Test Steps

1. Launch the development server with `npm run dev`
2. Open the application in your browser
3. Click the "Get Started" button in the navbar
4. In the modal, switch to the "Register" tab
5. Fill out the registration form:
   - Select "Guide" or "Tourist" role
   - Enter your full name, email, phone (optional), and password
   - Click "Create Account"
6. After successful registration, switch to the "Login" tab
7. Enter your credentials and click "Sign In"
8. Verify you're redirected to the Dashboard page showing your role and full name
9. Test the navigation menu - you should see Dashboard, Profile, Explore, and Chats options
10. Click "Sign Out" and verify you're redirected to Explore
11. Verify that only Explore and About are visible in the navbar when logged out

## Verify Profile Creation

Run this query in your Supabase SQL Editor to verify that profiles are being created:

```sql
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 10;
```

## Unit Test Suggestions

1. **AuthProvider Sign-In Test**:
   Test that the `signIn` function in AuthProvider correctly calls Supabase auth, returns a user, and fetches the associated profile.

```typescript
// Example test structure
test('signIn should authenticate user and fetch profile', async () => {
  // Mock Supabase responses
  const mockUser = { id: 'test-uuid', email: 'test@example.com' };
  const mockProfile = { id: 'test-uuid', full_name: 'Test User', role: 'guide' };
  
  // Set up mocks for supabase.auth.signInWithPassword and supabase.from().select()
  
  // Call the signIn function
  const { error } = await signIn('test@example.com', 'password');
  
  // Assert no error was returned
  expect(error).toBeNull();
  
  // Assert that profile was fetched and state was updated
});
```

2. **Registration Flow Test**:
   Test that the registration process creates both an auth user and a profile record.

```typescript
// Example test structure
test('signUp should create auth user and profile record', async () => {
  // Mock Supabase responses
  const mockUser = { id: 'test-uuid', email: 'test@example.com' };
  
  // Set up mocks for supabase.auth.signUp and supabase.from().insert()
  
  // Call the signUp function
  const { error } = await signUp('test@example.com', 'password', 'Test User', '+1234567890', 'guide');
  
  // Assert no error was returned
  expect(error).toBeNull();
  
  // Assert that both auth user and profile were created
});
```

## Next Steps

The upcoming subtasks will implement:

1. **Subtask 2**: Dashboard & profile picture upload functionality
2. **Subtask 3**: Explore page with guides search functionality

## Troubleshooting

- If registration fails but shows success, check the browser console for errors and verify your Supabase RLS policies.
- If the profile isn't being created, check the browser network tab for failed requests to the `profiles` table.
- For authentication issues, verify your Supabase URL and anon key are correctly set in the `.env.local` file.