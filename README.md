# OHS Management System

A modern **Occupational Health and Safety (OHS) Management System** built as a Single Page Application with a Micro Frontend–compatible architecture.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.x |
| UI Framework | React 18+ |
| Bundler | Vite |
| UI Library | Mantine UI |
| Server State | TanStack Query (React Query) |
| Client State | Zustand |
| Forms | React Hook Form |
| Validation | Zod |
| PDF Reports | jsPDF + jspdf-autotable |
| Excel Export | xlsx (SheetJS) |

## Project Structure

```
src/
├── domains/           # Business domains (micro-frontend ready)
│   ├── dashboard/
│   ├── risk/
│   ├── personnel/
│   └── training/
├── shell/             # Host container (Sidebar, Header, Layout)
│   ├── layout/
│   ├── sidebar/
│   └── header/
├── shared/
│   ├── api/           # API client
│   ├── forms/         # Zod schemas, createForm (RHF + Zod)
│   ├── stores/        # Zustand stores
│   └── utils/         # exportPdf, exportExcel
├── theme.ts           # Mantine theme (Enterprise Clean)
├── router.tsx
└── main.tsx
```

## Path Aliases

- `@/*` → `src/*`
- `@domains/*` → `src/domains/*`
- `@shell/*` → `src/shell/*`
- `@shared/*` → `src/shared/*`

## Scripts

```bash
npm install
npm run dev      # Development server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Features

- **Enterprise Clean UI**: Mantine-based, data-focused layout with Sidebar and Header shell.
- **Responsive**: Desktop-first, works on tablet and mobile for field use.
- **Forms**: React Hook Form + Zod for performant, validated forms.
- **Reports**: Client-side PDF generation and `.xlsx` export for tables.
- **State**: TanStack Query for server data; Zustand for session/theme and cross-module state.
- **Micro Frontend Ready**: Domain-based structure and Vite setup prepared for Module Federation when you add remote apps.

## Environment

Optional:

- `VITE_API_URL` – API base URL (default: `/api`)

## Adding a New Domain

1. Create `src/domains/<domain>/pages/` and add route in `src/router.tsx`.
2. Add a nav item in `src/shell/sidebar/ShellSidebar.tsx`.
3. Use `@shared/forms/createForm` and Zod schemas from `@shared/forms/schemas` for new forms.
4. Use `api` from `@shared/api/client` and TanStack Query for data.

## License

Private.
