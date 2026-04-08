# Sample AGENTS.md file

#  Project Context
-  This is the project of development of Personal Finance management application.
- The system has a React TS frontend that communicates with.
- The systems is also integrated with Relational MySQL Database for storing information.

## Development Context
- This project uses next js to create pages
- The project uses typescript for type safety and better code quality.
- This project uses shadcn/ui for UI components and styling.
- This Project uses Tailwind CSS for styling and layout.
- This Project uses Remix Icon for icons and visual elements.
- This project will use axios for HTTP requests in the frontend.

### Directory Structure & Conventions
- Pages are placed in the `app/` directory, following Next.js routing conventions (e.g., `app/about-us/page.tsx`).
- UI components are in `components/ui/`, layout components in `components/layout/`, and feature components in `components/components/`.
- Redux store is defined in `lib/store.ts`, with slices in `lib/slices/` (e.g., `authSlice.ts`).
- Utility functions are in `lib/utils.ts`.

### State Management (Redux Toolkit)
- State is managed using Redux Toolkit. The store is created in `lib/store.ts` and provided to the app in `app/providers.tsx`.
- Slices are defined in `lib/slices/` and registered in the store. Example: `authSlice.ts` manages authentication state.
- Use `useSelector` and `useDispatch` from `react-redux` for accessing and updating state.

### Environment Variables
- Environment variables are loaded from `.env.local` (see README for details). Update `.env.local.example` when adding new variables.

### Build & Run Scripts
- Main scripts (see `package.json`):
  - `npm run dev` — Start development server
  - `npm run build` — Build for production
  - `npm run start` — Start production server
  - `npm run lint` — Run ESLint

### API & HTTP Requests
- Use `axios` for HTTP requests. Example endpoint: `/api/v1/auth/login` for authentication.
- Base URL and API key are configured via environment variables.

### UI & Component Patterns
- Compose UI using shadcn/ui components in `components/ui/` (e.g., `Button`, `Card`, `Input`).
- Example: The login form is implemented as a reusable component in `components/components/login-form.tsx` and used in the login page.

### Adding a New Page or Component
- To add a new page, create a folder and `page.tsx` under `app/` (e.g., `app/new-feature/page.tsx`).
- For new UI components, add to `components/ui/` and follow the composition and export patterns seen in existing files.
