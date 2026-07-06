# SOLA Admin Panel Requirements

## Goal

Build a private internal admin system for SOLA Medical Supply to manage the B2B workflow from product request to quotation, order, payment, packing, shipment, and delivery follow-up.

This is not a public e-commerce checkout website. SOLA customers usually request products through WhatsApp or direct communication. Admin staff create quotes, confirm orders, and manage fulfilment internally.

## Business workflow

1. Customer asks for products through WhatsApp, email, Telegram, or website contact form.
2. Admin checks product availability and prepares a quote.
3. Customer confirms the quote and sends payment.
4. Admin converts the quote into an order.
5. Admin tracks payment, packing, dispatch, shipping, tracking number, and delivery.
6. Admin follows up with the customer for repeat orders.

## Do not build in the first stage

- Do not build a public checkout.
- Do not publish product prices publicly.
- Do not allow customers to self-pay online.
- Do not build a full ERP.
- Do not build complex multi-role permissions yet.
- Do not sync products to the public website yet.

## Primary user

- Internal SOLA admin only.

## Future users

- Sales staff.
- Fulfilment staff.
- Finance/payment reviewer.

These roles are future scope and should not be implemented in the first MVP unless explicitly requested.

## Required modules

1. Dashboard
2. Products
3. Customers
4. Quotes
5. Orders
6. Payments
7. Shipments
8. Settings

## MVP priority

Build only these first:

1. Admin login
2. Dashboard shell
3. Products
4. Customers
5. Quotes
6. Orders

Payments and shipments can start as status fields inside Orders before becoming full modules.

## Brand and UI style

- Clean medical B2B dashboard.
- White background.
- Pink SOLA accent.
- Professional, calm, premium feel.
- Tables should be easy to scan.
- Forms should be simple and not overloaded.
- Mobile support is useful, but desktop admin usage is the main priority.

## Tech stack decision

Use:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for database, auth, and image storage
- Vercel deployment

Do not use Laravel, Docker, microservices, or a complex ERP structure for the first version.

## Completion rules for every task

Each implementation task must define a clear "Done means" checklist.

Default completion rules:

- Page loads without error.
- No TypeScript errors.
- Existing working routes are not broken.
- No unrelated refactor.
- No database schema changes unless the task explicitly asks for it.
- Changed files are listed after finishing.
- Testing steps are explained after finishing.

## Guardrails for Codex

Before coding:

- Read this file.
- Read `docs/database-schema.md`.
- Read `docs/implementation-roadmap.md`.
- Inspect the current project structure.
- Make a short plan.

When coding:

- Implement only the approved task.
- Do not rename existing routes.
- Do not change environment variable names.
- Do not remove existing working code.
- Do not invent new database fields unless necessary.
- Keep each task small.

After coding:

- List changed files.
- Explain what was implemented.
- Explain how to test.
- State any assumptions.

