import { NextResponse } from "next/server";

type QuotePayload = {
  name?: string;
  whatsapp?: string;
  country?: string;
  businessType?: string;
  product?: string;
  quantity?: string;
  note?: string;
  source?: Record<string, string | undefined>;
};

async function postWebhook(url: string, payload: QuotePayload & { createdAt: string }) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
}

async function sendEmail(payload: QuotePayload & { createdAt: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUOTE_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return false;

  const subject = `New SOLA quote request${payload.product ? `: ${payload.product}` : ""}`;
  const lines = [
    `Name: ${payload.name || ""}`,
    `WhatsApp: ${payload.whatsapp || ""}`,
    `Country: ${payload.country || ""}`,
    `Business type: ${payload.businessType || ""}`,
    `Product: ${payload.product || ""}`,
    `Quantity: ${payload.quantity || ""}`,
    `Note: ${payload.note || ""}`,
    `Created at: ${payload.createdAt}`,
    "",
    "Lead source:",
    JSON.stringify(payload.source || {}, null, 2)
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.QUOTE_FROM_EMAIL || "SOLA Leads <onboarding@resend.dev>",
      to,
      subject,
      text: lines.join("\n")
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Email failed: ${response.status}`);
  }

  return true;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as QuotePayload;

  if (!payload.name || !payload.whatsapp) {
    return NextResponse.json({ error: "Name and WhatsApp are required" }, { status: 400 });
  }

  const enrichedPayload = {
    ...payload,
    createdAt: new Date().toISOString()
  };

  const deliveries: string[] = [];
  const errors: string[] = [];

  for (const [label, url] of [
    ["google_sheets", process.env.GOOGLE_SHEETS_WEBHOOK_URL],
    ["crm", process.env.CRM_WEBHOOK_URL]
  ] as const) {
    if (!url) continue;
    try {
      await postWebhook(url, enrichedPayload);
      deliveries.push(label);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${label} failed`);
    }
  }

  try {
    const sent = await sendEmail(enrichedPayload);
    if (sent) deliveries.push("email");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "email failed");
  }

  console.info("SOLA quote lead", enrichedPayload);

  return NextResponse.json({
    ok: true,
    deliveries,
    errors,
    mode: deliveries.length ? "delivered" : "preview"
  });
}
