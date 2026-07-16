import Script from 'next/script';

/**
 * Loads the Umami analytics script only when configured via env
 * (NEXT_PUBLIC_UMAMI_SRC + NEXT_PUBLIC_UMAMI_WEBSITE_ID). Cookieless, so no
 * consent banner is required for analytics. Renders nothing otherwise.
 */
export function UmamiScript() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return null;
  return <Script src={src} data-website-id={websiteId} strategy="afterInteractive" defer />;
}
