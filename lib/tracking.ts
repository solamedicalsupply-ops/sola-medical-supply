export type LeadSource = {
  landingPage?: string;
  currentPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  productName?: string;
};

export function readLeadSource(productName?: string): LeadSource {
  if (typeof window === "undefined") return { productName };

  const params = new URLSearchParams(window.location.search);
  const firstLanding = window.localStorage.getItem("sola_landing_page") || window.location.href;
  const firstReferrer = window.localStorage.getItem("sola_referrer") || document.referrer || "direct";

  window.localStorage.setItem("sola_landing_page", firstLanding);
  window.localStorage.setItem("sola_referrer", firstReferrer);

  return {
    landingPage: firstLanding,
    currentPage: window.location.href,
    referrer: firstReferrer,
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    productName
  };
}
