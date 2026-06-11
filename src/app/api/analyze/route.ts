import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";
import { buildAffiliateUrl } from "@/lib/affiliate";

const bodySchema = z.object({ url: z.string().url() });

type AnalyzeProduct = {
  title: string;
  description: string;
  image: string;
  images: string[];
  price: string | null;
  stock: string;
  deliveryTime: string;
  originalUrl: string;
  affiliateUrl: string;
  store: string;
  blocked?: boolean;
  warning?: string;
};

function fallbackProduct(originalUrl: string, reason: string) {
  const url = new URL(originalUrl);
  const store = url.hostname.replace("www.", "");
  const readableSlug = url.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return {
    title: readableSlug || `Producto de ${store}`,
    description: "La tienda bloqueó la lectura automática. Completa o edita esta ficha manualmente antes de publicarla.",
    image: "",
    images: [],
    price: null,
    stock: "",
    deliveryTime: "",
    originalUrl,
    affiliateUrl: buildAffiliateUrl(originalUrl),
    store,
    blocked: true,
    warning: reason
  } satisfies AnalyzeProduct;
}

function readMeta($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).attr("content") || $(selector).text();
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanPrice(value: string) {
  if (!value) return null;

  const text = cheerio.load(value).text() || value;
  const match = cleanText(text).match(/\d[\d.,]*/);
  return match ? match[0].replace(/,(?=\d{1,2}$)/, ".").replace(/,/g, "") : null;
}

function readPrice($: cheerio.CheerioAPI) {
  const mainSalePrice = cleanPrice($(".summary.entry-summary p.price ins .woocommerce-Price-amount").first().text());
  if (mainSalePrice) return Number(mainSalePrice).toFixed(2);

  const mainPrice = cleanPrice($(".summary.entry-summary p.price .woocommerce-Price-amount").last().text());
  if (mainPrice) return Number(mainPrice).toFixed(2);

  const simpleMainPrice = cleanPrice($(".summary.entry-summary p.price").first().text());
  if (simpleMainPrice) return Number(simpleMainPrice).toFixed(2);

  const candidates: string[] = [];
  const selectors = [
    ".summary .price .woocommerce-Price-amount",
    ".summary .price",
    ".woocommerce-Price-amount",
    '[itemprop="price"]',
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    ".price"
  ];

  for (const selector of selectors) {
    $(selector).each((_index, element) => {
      const raw = $(element).attr("content") || $(element).text();
      const text = cheerio.load(raw).text() || raw;
      const matches = text.match(/\d[\d.,]*/g) || [];
      candidates.push(...matches);
    });
  }

  const prices = candidates
    .map((candidate) => Number(cleanPrice(candidate)))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (!prices.length) return null;

  return prices[prices.length - 1].toFixed(2);
}

function readDeliveryTime($: cheerio.CheerioAPI) {
  const bodyText = cleanText($("body").text());
  const deliveryMatch = bodyText.match(/Entrega:\s*([^\.]+\.?)/i);
  if (deliveryMatch?.[1]) return `Entrega: ${cleanText(deliveryMatch[1])}`;

  return cleanText(readMeta($, [
    '[class*="delivery-time"]',
    '[class*="estimated-delivery"]',
    '[class*="tiempo-entrega"]'
  ]));
}

function readImages($: cheerio.CheerioAPI, originalUrl: string) {
  const images = new Set<string>();
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    ".woocommerce-product-gallery__image img",
    ".product .images img",
    ".product-gallery img",
    "img.wp-post-image"
  ];

  for (const selector of selectors) {
    $(selector).each((_index, element) => {
      const image = $(element).attr("content")
        || $(element).attr("data-large_image")
        || $(element).attr("data-src")
        || $(element).attr("src");

      if (image) images.add(new URL(image, originalUrl).toString());
    });
  }

  return Array.from(images).filter((image) => !image.startsWith("data:")).slice(0, 8);
}

function productSlugFromUrl(productUrl: string) {
  return new URL(productUrl).pathname.split("/").filter(Boolean).pop() || "";
}

function decodeHtml(value: string) {
  return cleanText(cheerio.load(value).text() || value);
}

async function fetchWithBrowserApi(productUrl: string) {
  if (process.env.SCRAPINGBEE_API_KEY) {
    const apiUrl = new URL("https://app.scrapingbee.com/api/v1/");
    apiUrl.searchParams.set("api_key", process.env.SCRAPINGBEE_API_KEY);
    apiUrl.searchParams.set("url", productUrl);
    apiUrl.searchParams.set("render_js", "true");
    apiUrl.searchParams.set("premium_proxy", "true");
    apiUrl.searchParams.set("country_code", "us");
    apiUrl.searchParams.set("wait", "3000");

    return fetch(apiUrl, { cache: "no-store" });
  }

  if (process.env.ZENROWS_API_KEY) {
    const apiUrl = new URL("https://api.zenrows.com/v1/");
    apiUrl.searchParams.set("apikey", process.env.ZENROWS_API_KEY);
    apiUrl.searchParams.set("url", productUrl);
    apiUrl.searchParams.set("js_render", "true");
    apiUrl.searchParams.set("premium_proxy", "true");

    return fetch(apiUrl, { cache: "no-store" });
  }

  if (process.env.SCRAPERAPI_KEY) {
    const apiUrl = new URL("https://api.scraperapi.com/");
    apiUrl.searchParams.set("api_key", process.env.SCRAPERAPI_KEY);
    apiUrl.searchParams.set("url", productUrl);
    apiUrl.searchParams.set("render", "true");
    apiUrl.searchParams.set("premium", "true");

    return fetch(apiUrl, { cache: "no-store" });
  }

  return null;
}

async function readWooCommerceStoreApi(productUrl: string): Promise<AnalyzeProduct | null> {
  const url = new URL(productUrl);
  const slug = productSlugFromUrl(productUrl);
  if (!slug) return null;

  const apiUrl = new URL("/wp-json/wc/store/v1/products", url.origin);
  apiUrl.searchParams.set("slug", slug);

  const response = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "es,en;q=0.9"
    },
    cache: "no-store"
  });

  if (!response.ok) return null;

  const data = await response.json();
  const product = Array.isArray(data) ? data[0] : null;
  if (!product) return null;

  const images = Array.isArray(product.images)
    ? product.images.map((image: { src?: string }) => image.src).filter(Boolean)
    : [];
  const price = product.prices?.price
    ? String(Number(product.prices.price) / 10 ** Number(product.prices.currency_minor_unit || 2))
    : null;

  return {
    title: decodeHtml(product.name || "Título no detectado"),
    description: decodeHtml(product.short_description || product.description || ""),
    image: images[0] || "",
    images,
    price,
    stock: decodeHtml(product.is_in_stock ? "En existencia" : "Sin existencia"),
    deliveryTime: "",
    originalUrl: productUrl,
    affiliateUrl: buildAffiliateUrl(productUrl),
    store: url.hostname.replace("www.", "")
  };
}

async function fetchProductHtml(productUrl: string) {
  const response = await fetch(productUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "es,en;q=0.9",
      "Referer": new URL(productUrl).origin
    },
    cache: "no-store"
  });

  if (response.ok) return response.text();

  const browserResponse = await fetchWithBrowserApi(productUrl);
  if (browserResponse?.ok) return browserResponse.text();
  if (browserResponse) {
    const provider = process.env.SCRAPINGBEE_API_KEY
      ? "ScrapingBee"
      : process.env.ZENROWS_API_KEY
        ? "ZenRows"
        : "ScraperAPI";
    const detail = cleanText(await browserResponse.text());
    throw new Error(`${provider} respondió con error ${browserResponse.status}${detail ? `: ${detail}` : ""}`);
  }

  throw new Error(`La tienda respondió con error ${response.status}. Puedes publicar el producto completando los datos manualmente.`);
}

export async function POST(request: Request) {
  let requestedUrl = "";

  try {
    const body = bodySchema.parse(await request.json());
    requestedUrl = body.url;
    const wooProduct = await readWooCommerceStoreApi(body.url);
    if (wooProduct) return NextResponse.json(wooProduct);

    const html = await fetchProductHtml(body.url);
    const $ = cheerio.load(html);
    const url = new URL(body.url);

    const title = readMeta($, [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      "title",
      "h1"
    ]);

    const description = readMeta($, [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
      ".woocommerce-product-details__short-description",
      ".product .summary .description",
      "#tab-description"
    ]);

    const images = readImages($, body.url);
    const image = images[0] || "";

    const price = readPrice($);

    const stock = cleanText(readMeta($, [
      ".stock",
      ".availability",
      '[class*="stock"]',
      '[class*="availability"]'
    ]));

    const deliveryTime = readDeliveryTime($);

    return NextResponse.json({
      title: title || "Título no detectado",
      description: description || "Descripción no detectada. Puedes editarla manualmente antes de publicar.",
      image,
      images,
      price: price || null,
      stock,
      deliveryTime,
      originalUrl: body.url,
      affiliateUrl: buildAffiliateUrl(body.url),
      store: url.hostname.replace("www.", "")
    });
  } catch (error) {
    if (!requestedUrl) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo analizar el enlace" }, { status: 400 });
    }

    return NextResponse.json(fallbackProduct(
      requestedUrl,
      error instanceof Error ? error.message : "No se pudo analizar el enlace"
    ));
  }
}
