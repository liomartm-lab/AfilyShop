import { NextResponse } from "next/server";
import { getProductByIdFromStore, registerProductClick } from "@/lib/products";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductByIdFromStore(id);

  if (!product) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await registerProductClick(id, request);
  return NextResponse.redirect(product.affiliateUrl);
}
