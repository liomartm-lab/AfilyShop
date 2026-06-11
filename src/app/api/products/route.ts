import { NextResponse } from "next/server";
import { z } from "zod";
import { createProduct, getPublishedProducts } from "@/lib/products";

const productSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  image: z.string().default(""),
  images: z.array(z.string()).optional(),
  price: z.string().nullable(),
  stock: z.string().optional(),
  deliveryTime: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  originalUrl: z.string().url(),
  affiliateUrl: z.string().url(),
  store: z.string().min(1),
  category: z.string().optional()
});

export async function GET() {
  try {
    const products = await getPublishedProducts();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron cargar los productos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = productSchema.parse(await request.json());
    const product = await createProduct(body);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar el producto" },
      { status: 400 }
    );
  }
}
