# SOLA Dynamic App

Modern dynamic catalogue for SOLA Medical Supply.

## What Is Included

- Next.js App Router
- 194 product records migrated from the existing SOLA static site
- Dynamic catalogue search and category filtering
- Product detail pages
- WhatsApp quote handoff per product
- Quote form API with lead source tracking
- Optional Google Sheets webhook
- Optional CRM webhook
- Optional email notification through Resend
- Vercel Analytics

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and configure what you need:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=84981778670
GOOGLE_SHEETS_WEBHOOK_URL=
CRM_WEBHOOK_URL=
QUOTE_NOTIFICATION_EMAIL=
RESEND_API_KEY=
QUOTE_FROM_EMAIL=SOLA Leads <leads@your-domain.com>
```

The quote form works in preview mode without webhooks. It starts delivering when webhook or email variables are added.

## Deploy

Push this folder to GitHub and import it into Vercel as a Next.js project.
