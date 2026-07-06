# SOLA Admin Panel Database Schema

This file is the source of truth for the first SOLA Admin Panel database design.

Do not invent new fields unless a task explicitly requires it. If a field needs to be added, update this document first and explain why.

## products

- id uuid primary key
- name text not null
- category text
- brand text
- origin text
- image_url text
- cost_price numeric
- sale_price numeric
- stock_status text
- internal_notes text
- created_at timestamp

Allowed stock_status values:

- in_stock
- out_of_stock
- ask_first

## customers

- id uuid primary key
- name text not null
- whatsapp text
- email text
- country text
- customer_type text
- notes text
- created_at timestamp

Suggested customer_type values:

- clinic
- medical_spa
- reseller
- distributor
- other

## quotes

- id uuid primary key
- customer_id uuid
- quote_number text
- status text
- subtotal numeric
- shipping_fee numeric
- discount numeric
- total numeric
- notes text
- created_at timestamp

Suggested quote status values:

- draft
- sent
- accepted
- rejected
- expired

## quote_items

- id uuid primary key
- quote_id uuid
- product_id uuid
- product_name text
- quantity integer
- unit_price numeric
- total_price numeric

## orders

- id uuid primary key
- quote_id uuid
- customer_id uuid
- order_number text
- payment_status text
- shipping_status text
- total_amount numeric
- profit numeric
- tracking_number text
- notes text
- created_at timestamp

Suggested payment_status values:

- unpaid
- partially_paid
- paid
- refunded

Suggested shipping_status values:

- not_started
- preparing
- packing_proof_ready
- dispatched
- in_transit
- delivered
- issue

## Future tables

These are not required for the first MVP:

- payments
- shipments
- order_files
- admin_users
- audit_logs
- supplier_costs
- country_price_rules

Only add them after the MVP modules are working.

