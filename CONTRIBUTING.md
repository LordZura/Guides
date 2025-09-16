# Contributing to TourGuideHub

## Development Setup

1. **Prerequisites**: Node.js v16+, Supabase account
2. **Environment**: Copy `.env.example` to `.env.local` and configure Supabase credentials
3. **Database**: Run all migration files in `src/db/migrations/` in numerical order
4. **Install**: `npm install`
5. **Develop**: `npm run dev`

## Code Structure

- **Components**: Reusable UI components in `/src/components/`
- **Pages**: Route components in `/src/pages/`
- **Contexts**: Global state management in `/src/contexts/`
- **Hooks**: Custom React hooks in `/src/hooks/`
- **Database**: SQL migrations in `/src/db/migrations/`

## Development Guidelines

- **TypeScript**: Use proper types, avoid `any`
- **Testing**: Add tests for new features using Vitest
- **Linting**: Run `npm run lint` before committing
- **Build**: Ensure `npm run build` passes before PR
- **Security**: Never commit secrets or credentials

## Key Features to Understand

- **Authentication**: Role-based (Guide/Tourist) via Supabase Auth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: Supabase real-time subscriptions for notifications
- **File Upload**: Supabase Storage for profile pictures
- **Payment**: Integrated booking and payment tracking system

## Making Changes

1. Create feature branch from main
2. Make focused, atomic commits
3. Test thoroughly (build, lint, functionality)
4. Submit PR with clear description
5. Ensure all migrations are included if DB changes

## Common Issues

- **Build Errors**: Check TypeScript types and imports
- **Auth Issues**: Verify Supabase RLS policies
- **Database Errors**: Ensure all migrations are applied
- **Environment**: Check `.env.local` configuration