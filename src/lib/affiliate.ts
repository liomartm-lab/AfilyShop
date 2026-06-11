export function buildAffiliateUrl(originalUrl: string) {
  const affiliateCode = process.env.DEFAULT_AFFILIATE_CODE || "TU-CODIGO";

  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname.replace("www.", "");

    if (hostname.includes("amazon.")) {
      url.searchParams.set("tag", process.env.AMAZON_AFFILIATE_TAG || affiliateCode);
      return url.toString();
    }

    if (hostname.includes("walmart.")) {
      url.searchParams.set("affp1", process.env.WALMART_AFFILIATE_ID || affiliateCode);
      return url.toString();
    }

    url.searchParams.set("ref", affiliateCode);
    return url.toString();
  } catch {
    return originalUrl;
  }
}
