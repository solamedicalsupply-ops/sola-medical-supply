# SOLA Admin Panel Implementation Roadmap

Build the admin system in small, testable tasks. Do not build the full system in one prompt.

## Phase 0 — Documentation only

Status: current step.

Create and maintain:

1. `docs/admin-requirements.md`
2. `docs/database-schema.md`
3. `docs/implementation-roadmap.md`

Done means:

- The docs exist.
- Scope is clear.
- MVP priority is clear.
- Database fields are written before coding.

## Phase 1 — Project setup

Task:

Create a new Next.js admin project or confirm the existing admin project structure.

Requirements:

- Next.js App Router
- TypeScript
- Tailwind CSS
- SOLA pink and white branding foundation
- Folder structure only
- Do not build features yet

Done means:

- `npm run dev` works.
- No TypeScript errors.
- Basic routes can load.
- No Supabase connection yet.

## Phase 2 — Base admin layout

Task:

Build the admin shell only.

Requirements:

- `/login` placeholder
- `/admin/dashboard` page
- Sidebar navigation
- Topbar
- Empty placeholder pages for:
  - `/admin/products`
  - `/admin/customers`
  - `/admin/quotes`
  - `/admin/orders`
  - `/admin/settings`

Do not connect Supabase yet.
Do not build CRUD yet.

Done means:

- All routes load.
- Sidebar navigation works.
- UI matches SOLA white and pink style.
- No TypeScript errors.

## Phase 3 — Supabase setup

Task:

Add Supabase client setup.

Requirements:

- Create Supabase client files.
- Add `.env.example`.
- Use:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Do not hardcode keys.
- Do not build auth UI yet.

Done means:

- Environment variable names are documented.
- Supabase client imports without errors.
- No secret values are committed.

## Phase 4 — Admin auth

Task:

Build admin login using Supabase Auth.

Requirements:

- `/login` page
- Protect all `/admin` routes
- Redirect unauthenticated users to `/login`
- Keep first version simple

Done means:

- Logged-out users cannot access `/admin`
- Logged-in admin can access dashboard
- Logout works
- No unrelated modules are changed

## Phase 5 — Products module

Task:

Build Products CRUD only.

Requirements:

- Product table
- Add product form
- Edit product form
- Delete product action
- Fields must follow `docs/database-schema.md`
- Stock status options:
  - in_stock
  - out_of_stock
  - ask_first

Do not build customers, quotes, or orders in this task.

Done means:

- Admin can add product
- Product appears in table
- Admin can edit product
- Admin can delete product
- No TypeScript errors

## Phase 6 — Customers module

Task:

Build Customers CRUD only.

Requirements:

- Customer table
- Add customer form
- Edit customer form
- Delete customer action
- Fields:
  - name
  - whatsapp
  - email
  - country
  - customer_type
  - notes

Do not build quotes or orders in this task.

Done means:

- Admin can add customer
- Customer appears in table
- Admin can edit customer
- Admin can delete customer

## Phase 7 — Quotes module

Task:

Build Quotes module.

Requirements:

- Admin can select customer
- Admin can add products
- Quantity
- Unit price
- Shipping fee
- Discount
- Total calculation
- Quote status

Do not build order conversion in the first Quotes task unless explicitly requested.

Done means:

- Admin can create quote
- Quote items calculate totals
- Quote appears in table
- Quote can be edited

## Phase 8 — Orders module

Task:

Build Orders module.

Requirements:

- Convert accepted quote into order
- Track payment_status
- Track shipping_status
- Add tracking_number
- Add internal notes

Done means:

- Admin can create order from quote
- Order appears in table
- Payment status can be updated
- Shipping status can be updated

## Later phases

Add only after MVP is stable:

- Payment proof upload
- Packing proof upload
- Invoice PDF
- WhatsApp quote generator
- Profit dashboard
- Product prices by country
- Public website catalogue sync
- Customer order tracking page
- Repeat order workflow

