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



---

For further learning, see:
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)

