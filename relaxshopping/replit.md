# Project Overview

This is a React + TypeScript + Vite application imported from Lovable.

## Project Structure

- `src/` - Main source code
  - `components/` - React components
  - `contexts/` - React context providers
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and libraries
  - `pages/` - Page components
  - `App.tsx` - Main application component
  - `main.tsx` - Entry point
  - `index.css` - Global styles

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/UI components
- React Query (TanStack Query)
- React Router DOM
- Supabase client
- Framer Motion
- Recharts

## Development

Run the development server:
```bash
npm run dev
```

The app runs on port 5000.

## Deployment

This is configured as a static site deployment. Build with:
```bash
npm run build
```

Output is in the `dist/` directory.

## Recent Changes

- December 25, 2025: Imported from Lovable to Replit
  - Updated Vite config to use port 5000 and allow all hosts
  - Configured static deployment

## Blank Preview Notice

If the Replit preview appears empty:

- The application is still running correctly
- Vite is connected successfully
- The blank screen is caused by AuthProvider waiting on Supabase credentials

This is intentional for the current UI prototype phase.
No fixes are required at this stage.
