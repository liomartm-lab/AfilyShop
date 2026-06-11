import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";
import { buildAffiliateUrl } from "@/lib/affiliate";

const bodySchema = z.object({ url: z.string().url() });

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
  };
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

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const response = await fetch(body.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "es,en;q=0.9",
        "Referer": new URL(body.url).origin
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(fallbackProduct(body.url, `La tienda respondió con error ${response.status}. Puedes publicar el producto completando los datos manualmente.`));
    }

    const html = await response.text();
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

    const rawPrice = readMeta($, [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      '[itemprop="price"]',
      ".woocommerce-Price-amount",
      ".summary .price",
      ".price"
    ]);
    const price = cleanPrice(rawPrice);

    const stock = cleanText(readMeta($, [
      ".stock",
      ".availability",
      '[class*="stock"]',
      '[class*="availability"]'
    ]));

    const deliveryTime = cleanText(readMeta($, [
      '[class*="delivery"]',
      '[class*="shipping"]',
      '[class*="entrega"]',
      '[class*="envio"]'
    ]));

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
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo analizar el enlace" }, { status: 400 });
  }
}
