import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";
import { buildAffiliateUrl } from "@/lib/affiliate";

const bodySchema = z.object({ url: z.string().url() });

function readMeta($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).attr("content") || $(selector).text();
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const response = await fetch(body.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept-Language": "es,en;q=0.9"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json({ error: `La tienda respondió con error ${response.status}` }, { status: 400 });
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
      'meta[name="twitter:description"]'
    ]);

    const rawImage = readMeta($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]'
    ]);
    const image = rawImage ? new URL(rawImage, body.url).toString() : "";

    const price = readMeta($, [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      '[itemprop="price"]'
    ]);

    return NextResponse.json({
      title: title || "Título no detectado",
      description: description || "Descripción no detectada. Puedes editarla manualmente antes de publicar.",
      image,
      price: price || null,
      originalUrl: body.url,
      affiliateUrl: buildAffiliateUrl(body.url),
      store: url.hostname.replace("www.", "")
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo analizar el enlace" }, { status: 400 });
  }
}
