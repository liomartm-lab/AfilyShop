import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getProductBySlugFromStore } from "@/lib/products";
import { ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlugFromStore(slug);
  if (!product) notFound();

  return (
    <main>
      <Header />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-2">
        <div className="relative h-[420px] overflow-hidden rounded-[2rem] bg-white shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className="h-full w-full object-cover" />
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-slate-100">
          <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-600">{product.category}</span>
          <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950">{product.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="mt-6 text-4xl font-black">${product.price.toFixed(2)}</div>
          <p className="mt-2 text-sm font-semibold text-slate-400">Precio aproximado detectado desde tienda externa.</p>
          <Link href={`/go/${product.id}`} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-lg font-black text-white hover:bg-brand-700 md:w-auto">
            Comprar ahora <ExternalLink />
          </Link>
          <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
            <div className="mb-2 flex items-center gap-2 font-black"><ShieldCheck size={18} /> Aviso de afiliado</div>
            Este producto se vende en una tienda externa. Podemos recibir una comisión si compras usando este enlace, sin costo adicional para ti.
          </div>
        </div>
      </section>
    </main>
  );
}
