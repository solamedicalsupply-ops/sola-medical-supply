"use client";

import { FormEvent, useMemo, useState } from "react";
import { readLeadSource } from "@/lib/tracking";
import { whatsappUrl } from "@/lib/products";

type QuoteFormProps = {
  productName?: string;
  compact?: boolean;
};

export function QuoteForm({ productName, compact }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const defaultWhatsAppMessage = useMemo(() => {
    return productName
      ? `Hello SOLA Medical Supply, I would like a wholesale quote for ${productName}.`
      : "Hello SOLA Medical Supply, I would like to request a wholesale quotation.";
  }, [productName]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      country: String(formData.get("country") || ""),
      businessType: String(formData.get("businessType") || ""),
      product: String(formData.get("product") || productName || ""),
      quantity: String(formData.get("quantity") || ""),
      note: String(formData.get("note") || ""),
      source: readLeadSource(productName)
    };

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Quote request failed");
      setStatus("sent");
      setMessage("Request saved. You can also continue on WhatsApp.");
    } catch {
      setStatus("error");
      setMessage("The form could not send yet. Please continue on WhatsApp.");
    }
  }

  return (
    <form className={compact ? "quote-form compact" : "quote-form"} onSubmit={submit}>
      <div className="form-grid">
        <label>
          Name
          <input name="name" placeholder="Your name" required />
        </label>
        <label>
          WhatsApp
          <input name="whatsapp" placeholder="+60..." required />
        </label>
        <label>
          Country
          <input name="country" placeholder="Malaysia" />
        </label>
        <label>
          Business type
          <select name="businessType" defaultValue="">
            <option value="" disabled>
              Select one
            </option>
            <option>Clinic</option>
            <option>Spa / Beautician</option>
            <option>Distributor</option>
            <option>Reseller</option>
            <option>Personal buyer</option>
          </select>
        </label>
      </div>
      <label>
        Product interest
        <input name="product" defaultValue={productName || ""} placeholder="Product or category" />
      </label>
      <label>
        Quantity
        <input name="quantity" placeholder="Example: 10 boxes, mixed items, trial order" />
      </label>
      <label>
        Note
        <textarea name="note" placeholder="Tell us what you need, destination, or shipping questions." rows={4} />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Send quote request"}
        </button>
        <a href={whatsappUrl(defaultWhatsAppMessage)}>Continue on WhatsApp</a>
      </div>
      {message && <p className={`form-status ${status}`}>{message}</p>}
    </form>
  );
}
