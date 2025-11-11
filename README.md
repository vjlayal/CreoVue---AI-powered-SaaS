# CreoVue — AI powered SaaS

CreoVue is a Next.js + TypeScript video SaaS prototype that demonstrates authenticated uploads, asset management (Cloudinary), and a simple subscription UI. It is built as a starting point for a scalable media-handling product.

## Key features
- Auth: Clerk (sign-up / sign-in flows)
- Media: Upload and manage images & videos (Cloudinary)
- Persistence: Prisma ORM with PostgreSQL (NeonDB)
- UI: Next.js (App Router), React, Tailwind CSS + DaisyUI
- Subscription UI: interactive plan cards (non‑functional placeholder)
- Dev ergonomics: TypeScript, ESLint, Prisma migrations

## Tech stack
- Next.js (App Router)
- React + TypeScript
- Prisma (Postgres)
- Cloudinary (media storage)
- Clerk (authentication)
- Tailwind CSS + DaisyUI (styling)

## Quick start (local)
1. Clone repository
2. Create `.env` in project root with required variables (example):
   - DATABASE_URL="postgresql://..."
   - CLOUDINARY_URL="cloudinary://<key>:<secret>@<cloud_name>"
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   - CLERK_SECRET_KEY=...
3. Install and generate Prisma client:
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
4. Run dev server:
   npm run dev
5. Open http://localhost:3000

## Deployment
Recommended: Vercel (connect repo, set environment variables listed above). Ensure Prisma migrations are applied and Cloudinary + Clerk credentials are added to the deployment environment.

## Project structure (high level)
- app/ — Next.js app routes & pages (App Router)
- app/api/ — server API routes (uploads, metadata)
- components/ — reusable UI components (VideoCard, etc.)
- prisma/ — schema & migrations
- styles/ — global Tailwind/DaisyUI styles

## Notes & recommendations
- Large file uploads: consider direct-to-Cloudinary client uploads or server streaming (busboy/formidable) to avoid Next body-size limits.
- Persistence of subscription state: currently UI-only; persist to Clerk metadata or DB for production.
- Keep `.env` out of version control.

## Contributing
Issues and PRs welcome. For significant changes (payments, streaming uploads), open an issue first to discuss design.
<<<<<<< HEAD

## License
MIT
=======
>>>>>>> fix/resolve-conflicts
