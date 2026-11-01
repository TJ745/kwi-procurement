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

- Public sign-up is disabled. The Super Admin (the single `.env`-managed account) creates users in **Users** with a temporary password; users must choose their own password at first sign-in.
- **Roles** are custom roles with a View/Create/Edit/Delete permission matrix per module (`lib/permissions.ts`). The Super Admin always has full access and cannot be edited, deactivated or reassigned from the UI.
- Users, Roles and Settings are restricted to the Super Admin.
- Users are deactivated, never deleted: deactivation signs them out and blocks sign-in.
- `proxy.ts` only performs an optimistic redirect when no session cookie exists. Authorization is enforced on the server by `requireUser()` / `requirePermission()` / `requireSuperAdmin()` in `lib/session.ts` for pages, and `runMutation()` in `lib/actions/run-mutation.ts` for every Server Action. Roles, status and permissions are read from the database on every request.
- Better Auth endpoints the app does not use (self-service profile, email and password changes, password reset) are disabled so they cannot bypass these rules.

## Settings

- **Company profile**: name, address, VAT, CR, phone, email and logo (PNG/JPEG/WebP, ≤ 512 KB).
- **Regional**: default currency, time zone and date format (dates across the app follow these).
- **Security**: session duration (fixed lifetime from sign-in, 1–720 hours) and minimum password length (8–128).
- **Document numbering**: prefix, digits, next number, year in the number and yearly restart for MR, PO, Payment Request and GRN. `allocateDocumentNumber()` in `lib/numbering.ts` assigns numbers atomically for the procurement modules.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:migrate:status` | Show migration status |
| `npm run sync-super-admin` | Create/update the Super Admin from `.env` |
# kwi-procurement
