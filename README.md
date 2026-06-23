# Pengo — Coffee Shop Manager

A cloud, multi-user web app for running the Pengo coffee shop:

- **📦 Inventory** — stock levels, low-stock alerts, restock & usage logging with full history
- **📖 Recipes** — drink recipes with ingredients, steps and photos
- **✅ Workflow** — daily opening/closing checklists the team checks off
- **👥 Team & roles** — managers get full control; employees get a limited view

Built with **Next.js 16**, **Tailwind CSS v4**, and **Supabase** (Postgres + Auth + Storage).

---

## 1. Create your Supabase project (free)

1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name and a strong database password.
2. When it's ready, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

## 2. Load the database schema

1. In Supabase, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click **Run**.

This creates all tables, security rules (Row-Level Security), the auto-profile-on-signup trigger, the stock-quantity trigger, and the `recipe-images` storage bucket.

## 3. Configure the app

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your two values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

> A placeholder `.env.local` may already exist — just replace the values.

## 4. Run it

```bash
npm install   # if you haven't already
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **The first person to sign up automatically becomes the manager.**
- Everyone who signs up afterwards is an **employee**; a manager can promote them from the **Team** page.

> **Email confirmation:** by default Supabase emails a confirmation link on signup. For quick testing you can turn this off in **Supabase → Authentication → Providers → Email → "Confirm email" (off)**, then sign in immediately.

---

## Who can do what

| Action | Manager | Employee |
| --- | :---: | :---: |
| View inventory, recipes, workflow | ✅ | ✅ |
| Log restock / usage | ✅ | ✅ |
| Check off daily tasks | ✅ | ✅ |
| Add/edit/delete inventory items | ✅ | — |
| Add/edit/delete recipes | ✅ | — |
| Manage workflow task templates | ✅ | — |
| Manage team & roles | ✅ | — |

Permissions are enforced **both** in the UI and in the database (Supabase RLS), so they can't be bypassed.

---

## Deploy to the web (Vercel)

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** and import the repo.
3. Under **Environment Variables**, add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. **Deploy.** Your shop app is now live and usable from any phone, tablet or computer.

---

## Project structure

```
src/
  app/
    login/, signup/         Auth pages
    auth/actions.ts         Sign in / up / out
    (app)/                  Authenticated area (shared nav + auth guard)
      dashboard/            Low-stock + today's tasks overview
      inventory/            List, detail, add/edit, restock/usage
      recipes/              Cards, detail, create/edit with photo upload
      workflow/             Daily checklist + task templates
      team/                 Role management (manager-only)
  components/               Nav + reusable UI (dialogs, buttons)
  lib/
    supabase/               Browser + server Supabase clients
    auth.ts                 requireProfile / requireManager guards
    types.ts                Shared DB types
  proxy.ts                  Session refresh + route protection (Next 16 "middleware")
supabase/migrations/        Database schema + security policies
```

## Notes

- Inventory `current_qty` is kept in sync automatically by a database trigger whenever a restock/usage/adjustment is logged — the transaction log is the source of truth.
- Recipe ingredients are free-text by default and can optionally be linked to inventory items later (the schema already supports it via `recipe_ingredients.item_id`).
