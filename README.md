## Project Initialization

### 1. Next.js Setup
- This project uses [Next.js](https://nextjs.org/) for the React application framework.
- To start the development server:

```bash
npm run dev
```

### 2. Tailwind CSS Setup
- [Tailwind CSS](https://tailwindcss.com/) is used for utility-first styling.
- Tailwind is configured via `postcss.config.mjs` and imported in `app/globals.css`.
- To install Tailwind CSS and its dependencies:

```bash
npm install tailwindcss@latest postcss@latest autoprefixer@latest
```
- For more details, see the [Tailwind Next.js guide](https://tailwindcss.com/docs/guides/nextjs).

### 3. shadcn/ui Setup
- [shadcn/ui](https://ui.shadcn.com/) provides accessible, customizable UI components built on top of Radix UI and Tailwind CSS.
- To install shadcn/ui:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
```
- Components are placed in `components/ui/`.
- For documentation and usage, see the [shadcn/ui docs](https://ui.shadcn.com/docs).

### 4. Redux Toolkit Setup
- This project uses [Redux Toolkit](https://redux-toolkit.js.org/) for state management.
- To install Redux Toolkit and React Redux:

```bash
npm install @reduxjs/toolkit react-redux
```

- The Redux store is defined in the `store/` directory (for example, `store/index.ts` or `store.ts`).
- The Redux `<Provider>` is wired up at the application root (for example, in `app/layout.tsx` or a shared `app/providers.tsx` component) so that state is available throughout the app.
- When adding new slices, export them from the store and include them in the root reducer.

### 5. Environment Variables
- Environment-specific configuration is loaded from `.env.local` (which is git-ignored).
- Copy `.env.local.example` to `.env.local` and fill in values appropriate for your environment.
- The following variables are expected:

```bash
# Base URL for API requests (include protocol, no trailing slash)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Optional: API key or token used for authenticated requests
NEXT_PUBLIC_API_KEY=your-local-api-key
```

- Update `.env.local.example` whenever new required environment variables are introduced.

---

For further learning, see:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)

