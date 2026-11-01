# Procurement Management

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Prisma 7 + Neon PostgreSQL · Better Auth.

## Setup

1. `npm install` (also runs `prisma generate`).
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` – Neon **pooled** connection string (used by the app).
   - `DIRECT_URL` – Neon **direct** connection string (used by Prisma migrations).
   - `BETTER_AUTH_SECRET` – random string of at least 32 characters (`openssl rand -base64 32`).
   - `BETTER_AUTH_URL` – e.g. `http://localhost:3000`.
   - `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` (min. 12 characters), `SUPER_ADMIN_NAME` (optional).
3. Apply migrations: `npm run db:migrate` (`prisma migrate deploy`; creates tables, never drops them).
4. Create the Super Admin: `npm run sync-super-admin`.
5. `npm run dev` and sign in at <http://localhost:3000/sign-in>.

### Changing the Super Admin

Edit the `SUPER_ADMIN_*` values in `.env` and run `npm run sync-super-admin` again. It updates the
name and password, or changes the email when exactly one Super Admin exists. Changing the email or
password signs the Super Admin out of all sessions. Edits to `.env` have no effect until the command
is run. The command never promotes an existing ordinary user to Super Admin.

## Access control

- Public sign-up is disabled; accounts are provisioned by administrators.
- `user.role` (`super_admin` | `user`) is stored in the database and can never be set through Better Auth endpoints (`input: false`).
- `proxy.ts` only performs an optimistic redirect when no session cookie exists. Authorization is enforced on the server by `requireUser()` / `requireSuperAdmin()` in `lib/session.ts`, which every page (and future Server Action) calls.
- Users, Roles and Settings require Super Admin; other users receive a 403 page and do not see these links.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run sync-super-admin` | Create/update the Super Admin from `.env` |
# kwi-procurement
