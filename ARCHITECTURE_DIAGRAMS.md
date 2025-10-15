# TourGuideHub - Visual Architecture & Design Diagrams

> **Visual Reference**: This document provides visual representations of the system architecture, data flows, and user interactions for TourGuideHub.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React SPA (TypeScript)                     │  │
│  │                                                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │  │
│  │  │   Pages     │  │ Components  │  │  Contexts   │         │  │
│  │  │   (5)       │  │   (29)      │  │   (8)       │         │  │
│  │  │             │  │             │  │             │         │  │
│  │  │ - Explore   │  │ - TourCard  │  │ - Auth      │         │  │
│  │  │ - Details   │  │ - Booking   │  │ - Tours     │         │  │
│  │  │ - Dashboard │  │ - Reviews   │  │ - Bookings  │         │  │
│  │  │ - Profile   │  │ - Navbar    │  │ - Reviews   │         │  │
│  │  │ - Guides    │  │ - ...       │  │ - Notify    │         │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │  │
│  │         │                 │                 │                │  │
│  │         └─────────────────┴─────────────────┘                │  │
│  │                           │                                   │  │
│  │                    ┌──────▼──────┐                           │  │
│  │                    │   Router    │                           │  │
│  │                    │ (React)     │                           │  │
│  │                    └──────┬──────┘                           │  │
│  └───────────────────────────┼───────────────────────────────────┘  │
│                              │                                      │
│                    ┌─────────▼─────────┐                           │
│                    │  Supabase Client  │                           │
│                    │   (JS Library)    │                           │
│                    └─────────┬─────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               │ HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         SUPABASE CLOUD                              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │     Auth     │  │  PostgreSQL  │  │  Real-time   │            │
│  │   Service    │  │   Database   │  │   Engine     │            │
│  │              │  │              │  │              │            │
│  │ - JWT Auth   │  │ - 7 Tables   │  │ - WebSocket  │            │
│  │ - Sessions   │  │ - RLS        │  │ - Pub/Sub    │            │
│  │ - Providers  │  │ - Functions  │  │ - Changes    │            │
│  └──────────────┘  │ - Triggers   │  └──────────────┘            │
│                    │ - Indexes    │                               │
│  ┌──────────────┐  └──────────────┘  ┌──────────────┐            │
│  │   Storage    │                     │   PostgREST  │            │
│  │   (Files)    │                     │  (Auto API)  │            │
│  │              │                     │              │            │
│  │ - Avatars    │                     │ - REST API   │            │
│  │ - Images     │                     │ - CRUD Ops   │            │
│  └──────────────┘                     └──────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema Relationships

```
┌─────────────┐
│ auth.users  │ (Supabase managed)
└──────┬──────┘
       │
       │ 1:1
       │
┌──────▼──────────────────────────────────────────┐
│              profiles                           │
│  - id (FK → auth.users.id)                     │
│  - full_name, phone, avatar_url                │
│  - role: 'guide' | 'tourist'                   │
│  - bio, interests[], languages[]               │
│  - experience_years (guides)                   │
└──────┬──────────────────┬───────────────────────┘
       │                  │
       │ 1:N              │ 1:N
       │                  │
┌──────▼──────┐    ┌──────▼──────────────┐
│   tours     │    │   bookings          │
│  - creator  │◄───┤  - tourist_id (FK)  │
│  - title    │ N:1│  - guide_id (FK)    │
│  - price    │    │  - tour_id (FK)     │
│  - location │    │  - status           │
└──────┬──────┘    │  - payment_status   │
       │           └──────┬──────────────┘
       │                  │
       │ 1:N              │
       │                  │
┌──────▼────────────┐     │
│   reviews         │     │
│  - reviewer_id    │     │
│  - target_id      │◄────┘
│  - target_type    │
│  - rating (1-5)   │
│  - comment        │
└───────────────────┘

┌───────────────────┐    ┌────────────────────┐
│  notifications    │    │  tour_templates    │
│  - recipient_id   │    │  - creator_id      │
│  - actor_id       │    │  - template_data   │
│  - type, message  │    │  - is_system       │
│  - action_url     │    │  - category        │
└───────────────────┘    └────────────────────┘

┌───────────────┐
│  languages    │ (Standalone reference table)
│  - code       │
│  - name       │
└───────────────┘
```

---

## 🔄 Booking Flow Diagram

### Tourist-Initiated Flow
```
┌────────────────────────────────────────────────────────────────┐
│                    TOURIST BOOKING REQUEST                     │
└────────────────────────────────────────────────────────────────┘

    TOURIST                      SYSTEM                    GUIDE
       │                           │                         │
       │   Browse Tours            │                         │
       ├──────────────────────────►│                         │
       │   View Tour Details       │                         │
       ├──────────────────────────►│                         │
       │                           │                         │
       │   Submit Booking          │                         │
       │   (date, guests)          │                         │
       ├──────────────────────────►│                         │
       │                           │   Create Booking        │
       │                           │   status: 'requested'   │
       │                           ├────────────────────────►│
       │                           │   Send Notification     │
       │                           │   type: booking_request │
       │                           ├────────────────────────►│
       │                           │                         │
       │                           │        Review Request   │
       │                           │◄────────────────────────┤
       │                           │                         │
       │                           │   Accept/Decline        │
       │   Update Status           │◄────────────────────────┤
       │◄──────────────────────────┤   status: 'accepted'    │
       │   Notification            │                         │
       │   type: booking_accepted  │                         │
       │                           │                         │
       │   Confirm Payment         │                         │
       ├──────────────────────────►│                         │
       │                           │   Update Status         │
       │                           │   status: 'paid'        │
       │                           ├────────────────────────►│
       │                           │   Notification          │
       │                           │                         │
       │   [Tour Date]             │                         │
       │   Attend Tour             │                         │
       │                           │                         │
       │                           │   Mark Complete         │
       │   Update Status           │◄────────────────────────┤
       │◄──────────────────────────┤   status: 'completed'   │
       │                           │                         │
       │   Leave Review            │                         │
       ├──────────────────────────►│                         │
       │                           │   Notify Guide          │
       │                           ├────────────────────────►│
       │                           │   type: review_received │
       │                           │                         │
```

### Guide-Initiated Flow
```
┌────────────────────────────────────────────────────────────────┐
│                    GUIDE CUSTOM OFFER                          │
└────────────────────────────────────────────────────────────────┘

    GUIDE                        SYSTEM                   TOURIST
       │                           │                         │
       │   Create Custom Offer     │                         │
       │   (specific tourist)      │                         │
       ├──────────────────────────►│                         │
       │                           │   Create Booking        │
       │                           │   status: 'offered'     │
       │                           ├────────────────────────►│
       │                           │   Send Notification     │
       │                           │   type: booking_offered │
       │                           ├────────────────────────►│
       │                           │                         │
       │                           │   Review Offer          │
       │                           │◄────────────────────────┤
       │                           │                         │
       │                           │   Accept/Decline        │
       │   Update Status           │◄────────────────────────┤
       │◄──────────────────────────┤   status: 'accepted'    │
       │   Notification            │                         │
       │                           │                         │
       │   [Rest same as above]    │                         │
```

---

## 🔐 Row Level Security (RLS) Policy Flow

```
┌───────────────────────────────────────────────────────────┐
│                 CLIENT REQUEST                            │
│  "SELECT * FROM tours WHERE creator_id = 'abc123'"       │
└─────────────────────┬─────────────────────────────────────┘
                      │
                      │ Authenticated Request
                      │ (JWT Token in Header)
                      ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE AUTH SERVICE                       │
│  1. Validate JWT Token                                   │
│  2. Extract user_id from token                          │
│  3. Set auth.uid() = user_id                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Request + auth.uid()
                      ▼
┌─────────────────────────────────────────────────────────┐
│            POSTGRESQL RLS ENGINE                         │
│  1. Check if RLS enabled on table                       │
│  2. Find applicable policies for operation (SELECT)     │
│  3. Evaluate policy conditions                          │
│     ✓ "Anyone can view active tours"                    │
│       USING (is_active = true)                          │
│     ✓ "Users can view their own tours"                  │
│       USING (creator_id = auth.uid())                   │
│  4. Combine policies with OR logic                      │
│  5. Apply to query                                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Filtered Query
                      ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE EXECUTION                          │
│  SELECT * FROM tours                                     │
│  WHERE (is_active = true OR creator_id = 'current_user')│
│    AND creator_id = 'abc123'                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ Results (only authorized rows)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   CLIENT                                 │
│  Receives only data user is authorized to see           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Component Hierarchy

```
App
├── ErrorBoundary
│   └── ChakraProvider
│       └── BrowserRouter
│           └── AuthProvider
│               └── ModalProvider
│                   └── NotificationProvider
│                       └── TourTemplateProvider
│                           └── ReviewsProvider
│                               ├── NavBar
│                               │   ├── Logo
│                               │   ├── Navigation Links
│                               │   ├── NotificationBadge
│                               │   │   └── NotificationsList
│                               │   └── UserMenu / AuthButtons
│                               │
│                               └── Routes
│                                   ├── Explore Page
│                                   │   ├── Tabs (Tours | Guides)
│                                   │   ├── Filters
│                                   │   │   ├── Language Select
│                                   │   │   ├── Location Select
│                                   │   │   ├── Price Range
│                                   │   │   ├── Rating Filter
│                                   │   │   └── Day Availability
│                                   │   └── Results Grid
│                                   │       ├── TourCard (×N)
│                                   │       └── GuideCard (×N)
│                                   │
│                                   ├── Tour Details Page
│                                   │   ├── Tour Header
│                                   │   ├── Tour Info
│                                   │   ├── Location Itinerary
│                                   │   ├── BookingForm
│                                   │   ├── Guide Profile
│                                   │   └── Reviews Section
│                                   │       ├── ReviewsSummary
│                                   │       └── ReviewsList
│                                   │           └── ReviewItem (×N)
│                                   │
│                                   ├── Dashboard Page
│                                   │   ├── Profile Header
│                                   │   └── Role-Based Tabs
│                                   │       ├── Tourist Dashboard
│                                   │       │   ├── BookingsList
│                                   │       │   ├── ReviewsList
│                                   │       │   └── ProfileEditor
│                                   │       └── Guide Dashboard
│                                   │           ├── ToursList
│                                   │           ├── BookingsList
│                                   │           ├── PaymentTracker
│                                   │           ├── ReviewsList
│                                   │           └── ProfileEditor
│                                   │
│                                   └── Profile Page
│                                       ├── Guide Info
│                                       ├── Tours Grid
│                                       └── Reviews Section
│
└── AuthModal (if isAuthModalOpen)
    ├── Sign In Form
    └── Sign Up Form
        └── Role Selection (Guide | Tourist)
```

---

## 🌊 Data Flow - Review System

```
┌─────────────────────────────────────────────────────────────────┐
│                   REVIEW CREATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

User Action                Database                    UI Update
    │                          │                           │
    │  Submit Review           │                           │
    │  (rating + comment)      │                           │
    ├─────────────────────────►│                           │
    │                          │   1. Insert into reviews  │
    │                          │      table                │
    │                          │                           │
    │                          │   2. Trigger calculates   │
    │                          │      new average          │
    │                          │                           │
    │                          │   3. Insert notification  │
    │                          │      for target user      │
    │                          │                           │
    │                          │   4. Real-time event      │
    │                          │      published            │
    │                          ├──────────────────────────►│
    │  Success response        │                           │  Update UI
    │◄─────────────────────────┤                           │  - Show success
    │                          │                           │  - Refresh reviews
    │                          │                           │
    │                          │   Real-time listener      │
    │                          │   receives update         │
    │                          ├──────────────────────────►│
    │                          │                           │  Update notification
    │                          │                           │  badge count
    │                          │                           │

┌─────────────────────────────────────────────────────────────────┐
│                   REVIEW AGGREGATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

For TOUR reviews:
    reviews table
        │
        │ Direct query
        ▼
    get_review_summary('tour_id', 'tour')
        │
        ├─► average_rating: AVG(rating)
        ├─► total_reviews: COUNT(*)
        └─► rating_counts: { '1': X, '2': Y, ... }

For GUIDE reviews:
    reviews table
        │
        ├─► Direct guide reviews
        │   (target_type = 'guide')
        │
        └─► All tour reviews
            (target_type = 'tour' AND tours.creator_id = guide_id)
            │
            │ Union all ratings
            ▼
    get_review_summary('guide_id', 'guide')
        │
        ├─► average_rating: AVG(all_ratings)
        ├─► total_reviews: COUNT(all_reviews)
        └─► rating_counts: { '1': X, '2': Y, ... }
```

---

## 🔔 Real-time Notification Flow

```
┌──────────────────────────────────────────────────────────────┐
│              REAL-TIME NOTIFICATION SYSTEM                   │
└──────────────────────────────────────────────────────────────┘

ACTION                        DATABASE                  SUBSCRIBERS
  │                              │                           │
  │  Guide accepts booking       │                           │
  ├─────────────────────────────►│                           │
  │                              │   1. Update bookings      │
  │                              │      status = 'accepted'  │
  │                              │                           │
  │                              │   2. Insert notification  │
  │                              │      recipient_id = tourist│
  │                              │      type = 'booking_accepted'│
  │                              │                           │
  │                              │   3. Real-time event      │
  │                              │      INSERT on notifications│
  │                              ├──────────────────────────►│
  │                              │   WebSocket push          │
  │                              │                           │
  │                              │   Supabase Real-time      │
  │                              │   broadcasts change       │
  │                              ├──────────────────────────►│
  │                              │                           │  Tourist's browser
  │                              │                           │  receives event
  │                              │                           │
  │                              │                           ├─► Update badge count
  │                              │                           ├─► Add to notification list
  │                              │                           └─► Show toast (optional)


┌──────────────────────────────────────────────────────────────┐
│              NOTIFICATION SUBSCRIPTION SETUP                 │
└──────────────────────────────────────────────────────────────┘

Component Mount
    │
    ▼
NotificationContext.tsx
    │
    ├─► supabase.channel('notifications')
    │       .on('postgres_changes', {
    │           event: 'INSERT',
    │           schema: 'public',
    │           table: 'notifications',
    │           filter: `recipient_id=eq.${userId}`
    │       }, handleNewNotification)
    │       .subscribe()
    │
    └─► On new notification:
            1. Add to notifications array
            2. Increment unread count
            3. Update UI state

Component Unmount
    │
    └─► channel.unsubscribe()
```

---

## 📱 Responsive Layout Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE (0-767px)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ☰  Logo                         🔔 👤               │  │ Navbar
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │  🔍 Search                                           │  │ Search
│  │  [Filter Button]                                     │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         Tour Card 1                             │ │  │
│  │  │  Image                                          │ │  │
│  │  │  Title, Price                                   │ │  │
│  │  │  ⭐⭐⭐⭐⭐ (123)                                 │ │  │ 1 Column
│  │  └─────────────────────────────────────────────────┘ │  │ Grid
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │         Tour Card 2                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   TABLET (768-991px)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Logo    Home  Explore  About      🔔 👤 Login       │  │ Navbar
│  └───────────────────────────────────────────────────────┘  │
│  ┌─────────────────┬───────────────────────────────────────┐│
│  │  Filters        │  🔍 Search                           ││ Sidebar
│  │  ───────        │                                      ││ + Content
│  │  Language: All  │  ┌────────────┐  ┌────────────┐    ││
│  │  Location: All  │  │  Tour 1    │  │  Tour 2    │    ││ 2 Column
│  │  Price: $0-500  │  │  Image     │  │  Image     │    ││ Grid
│  │  Rating: All    │  │  Details   │  │  Details   │    ││
│  │                 │  └────────────┘  └────────────┘    ││
│  │  [Apply]        │  ┌────────────┐  ┌────────────┐    ││
│  └─────────────────┴───────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DESKTOP (992px+)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Logo    Home  Explore  Guides  About   🔔 👤 Login  │  │ Full Navbar
│  └───────────────────────────────────────────────────────┘  │
│  ┌─────────────────┬───────────────────────────────────────┐│
│  │  Filters        │  🔍 Search           [Sort ▼]        ││
│  │  ───────        │                                      ││
│  │  Language       │  ┌──────┐ ┌──────┐ ┌──────┐        ││ 3-4 Column
│  │  □ English      │  │Tour 1│ │Tour 2│ │Tour 3│        ││ Grid
│  │  □ Spanish      │  │Image │ │Image │ │Image │        ││
│  │  □ French       │  │Info  │ │Info  │ │Info  │        ││
│  │                 │  └──────┘ └──────┘ └──────┘        ││
│  │  Location       │  ┌──────┐ ┌──────┐ ┌──────┐        ││
│  │  □ Tbilisi      │  │Tour 4│ │Tour 5│ │Tour 6│        ││
│  │  □ Batumi       │  └──────┘ └──────┘ └──────┘        ││
│  │                 │                                      ││
│  │  Price Range    │  [Load More]                        ││
│  │  $0 ═══●═══ $500│                                      ││
│  │                 │                                      ││
│  │  Rating         │                                      ││
│  │  ⭐⭐⭐⭐⭐    │                                      ││
│  │                 │                                      ││
│  │  [Reset]        │                                      ││
│  └─────────────────┴───────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 User Journey Maps

### Tourist Journey
```
1. DISCOVERY
   └─► Visit /explore
       └─► Browse tours
           ├─► Apply filters (location, language, price)
           ├─► View tour cards
           └─► Click "View Details"

2. EVALUATION
   └─► Tour Details Page
       ├─► Read description
       ├─► View itinerary
       ├─► Check reviews (⭐ rating + comments)
       ├─► View guide profile
       └─► Decide to book

3. BOOKING
   └─► Log in (if not authenticated)
       └─► Fill booking form
           ├─► Select date
           ├─► Choose number of guests
           ├─► Add special requests
           └─► Submit request (status: 'requested')

4. WAITING
   └─► Receive notification
       └─► Guide accepts booking
           └─► Status: 'accepted'

5. PAYMENT
   └─► Confirm payment
       └─► Status: 'paid'
           └─► Receive confirmation

6. EXPERIENCE
   └─► Attend tour on scheduled date
       └─► Guide marks as complete
           └─► Status: 'completed'

7. REVIEW
   └─► Receive notification to review
       └─► Submit review
           ├─► Rate tour (1-5 stars)
           ├─► Write comment
           └─► Submit
```

### Guide Journey
```
1. SETUP
   └─► Create account (role: guide)
       └─► Complete profile
           ├─► Add bio
           ├─► List languages
           ├─► Specify experience
           └─► Upload avatar

2. TOUR CREATION
   └─► Dashboard → My Tours
       └─► Create New Tour
           ├─► Option 1: Use Template
           │   └─► Select system/user template
           │       └─► Customize details
           ├─► Option 2: From Scratch
           │   └─► Fill all fields
           │       ├─► Title, description
           │       ├─► Multi-location itinerary
           │       ├─► Pricing, capacity
           │       ├─► Languages, days available
           │       └─► Publish
           └─► Tour becomes active

3. BOOKING MANAGEMENT
   └─► Receive booking request
       ├─► Option A: Accept Request
       │   └─► Status: 'accepted'
       │       └─► Notify tourist
       └─► Option B: Decline Request
           └─► Status: 'declined'

   OR

   └─► Create Custom Offer
       └─► Select tourist, tour, date
           └─► Status: 'offered'
               └─► Notify tourist
                   └─► Tourist accepts
                       └─► Status: 'accepted'

4. PRE-TOUR
   └─► Tourist confirms payment
       └─► Status: 'paid'
           └─► Prepare for tour

5. TOUR DELIVERY
   └─► Conduct tour on scheduled date
       └─► Mark as complete
           └─► Status: 'completed'

6. POST-TOUR
   └─► Receive review notification
       └─► View review
           └─► Rating updates automatically
               └─► Appears on profile and tours

7. EARNINGS
   └─► Track payments in dashboard
       ├─► View total earnings
       ├─► Monitor pending payments
       └─► See earnings by tour
```

---

## 🔍 Search & Filter Logic

```
┌─────────────────────────────────────────────────────────────┐
│                   FILTER APPLICATION                        │
└─────────────────────────────────────────────────────────────┘

User Input                    Frontend Filter           Database Query
    │                              │                         │
    │  Select Language: Spanish    │                         │
    ├─────────────────────────────►│                         │
    │                              │  Filter state updated   │
    │                              │  { language: 'es' }     │
    │                              │                         │
    │  Select Location: Tbilisi    │                         │
    ├─────────────────────────────►│                         │
    │                              │  { language: 'es',      │
    │                              │    location: 'Tbilisi' }│
    │                              │                         │
    │  Set Price: $0-100           │                         │
    ├─────────────────────────────►│                         │
    │                              │  { language: 'es',      │
    │                              │    location: 'Tbilisi', │
    │                              │    priceMin: 0,         │
    │                              │    priceMax: 100 }      │
    │                              │                         │
    │                              │  Build query            │
    │                              ├────────────────────────►│
    │                              │  SELECT * FROM tours    │
    │                              │  WHERE                  │
    │                              │    'es' = ANY(languages)│
    │                              │    AND location ILIKE   │
    │                              │      '%Tbilisi%'        │
    │                              │    AND price BETWEEN    │
    │                              │      0 AND 100          │
    │                              │    AND is_active = true │
    │                              │                         │
    │                              │  Execute query          │
    │  Results                     │◄────────────────────────┤
    │◄─────────────────────────────┤  Return matching tours  │
    │  Display filtered tours      │                         │
    │                              │                         │
```

---

## 📊 State Management Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              CONTEXT PROVIDER PATTERN                       │
└─────────────────────────────────────────────────────────────┘

Component Tree
    │
    ├─► ToursContext
    │   │
    │   ├─► State:
    │   │   ├─ tours: Tour[]
    │   │   ├─ isLoading: boolean
    │   │   └─ error: string | null
    │   │
    │   └─► Methods:
    │       ├─ fetchTours(filters)
    │       │   └─► Supabase query
    │       │       └─► Set tours state
    │       ├─ createTour(data)
    │       │   └─► Supabase insert
    │       │       └─► Append to tours
    │       └─ updateTour(id, data)
    │           └─► Supabase update
    │               └─► Update in tours array
    │
    ├─► BookingContext
    │   │
    │   ├─► State:
    │   │   ├─ bookings: Booking[]
    │   │   └─ isLoading: boolean
    │   │
    │   └─► Methods:
    │       ├─ createBooking(data)
    │       ├─ updateStatus(id, status)
    │       └─ fetchBookings(role)
    │
    └─► NotificationContext
        │
        ├─► State:
        │   ├─ notifications: Notification[]
        │   └─ unreadCount: number
        │
        ├─► Real-time Subscription:
        │   └─► supabase.channel()
        │       └─► On INSERT → Add to array
        │
        └─► Methods:
            ├─ markAsRead(id)
            └─ markAllAsRead()


Components access context via hooks:
    const { tours, fetchTours } = useTours();
    const { createBooking } = useBooking();
    const { notifications } = useNotifications();
```

---

This visual documentation provides diagrams and flows to complement the detailed technical specification in AI_RECREATION_PROMPT.md.
