import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Product } from "@/data/products";

export function ProductCard({ product, productPath }: { product: Product; productPath?: string }) {
  const detailPath = productPath || `/product/${product.slug}`;

  return (
    <article className="group overflow-hidden rounded-[1.5rem] bg-white shadow-soft ring-1 ring-slate-100 transition hover:-translate-y-1">
      <Link href={detailPath} className="block">
        <div className="relative h-56 overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      </Link>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">{product.category}</span>
          <span className="text-xs font-semibold text-slate-400">{product.store}</span>
        </div>
        <Link href={detailPath}>
          <h3 className="line-clamp-2 text-lg font-black text-slate-950">{product.title}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{product.description}</p>
        {(product.stock || product.deliveryTime) && (
          <div className="mt-3 grid gap-1 text-xs font-bold text-slate-500">
            {product.stock && <span>{product.stock}</span>}
            {product.deliveryTime && <span>{product.deliveryTime}</span>}
          </div>
        )}
        <div className="mt-5 flex items-center justify-between gap-4">
          <strong className="text-2xl text-slate-950">${product.price.toFixed(2)}</strong>
          <Link href={`/go/${product.id}`} className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-black text-white hover:bg-brand-700">
            Comprar <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
