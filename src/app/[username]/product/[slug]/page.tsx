import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductByOwnerAndSlug } from "@/lib/products";
import { getStoreByUsername } from "@/lib/stores";
import { ExternalLink, MessageCircle, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicStoreProductPage({ params }: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const store = await getStoreByUsername(username);
  if (!store || store.status !== "active") notFound();

  const product = await getProductByOwnerAndSlug(store.ownerId, slug);
  if (!product) notFound();
  const whatsappPhone = store.phone.replace(/\D/g, "");
  const whatsappText = encodeURIComponent(`Hola, estoy interesado en: ${product.title}`);

  return (
    <main>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href={`/${store.username}`} className="text-xl font-black text-slate-950">{store.name}</Link>
          <Link href={`/${store.username}`} className="text-sm font-bold text-slate-500">Volver al catálogo</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-2">
        <div className="relative h-[420px] overflow-hidden rounded-[2rem] bg-white shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.imageUrl || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className="h-full w-full object-cover" />
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-slate-100">
          <span className="rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: store.theme.primaryColor }}>{product.category}</span>
          <h1 className="mt-5 text-4xl font-black leading-tight text-slate-950">{product.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
          <div className="mt-6 text-4xl font-black">${product.price.toFixed(2)}</div>
          <p className="mt-2 text-sm font-semibold text-slate-400">Precio aproximado detectado desde tienda externa.</p>
          <Link href={`/go/${product.id}`} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-black text-white md:w-auto" style={{ background: store.theme.primaryColor }}>
            Comprar ahora <ExternalLink />
          </Link>
          {whatsappPhone && (
            <a href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`} target="_blank" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white md:ml-3 md:w-auto">
              Consultar por WhatsApp <MessageCircle />
            </a>
          )}
          <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-900 ring-1 ring-amber-100">
            <div className="mb-2 flex items-center gap-2 font-black"><ShieldCheck size={18} /> Aviso de afiliado</div>
            Este producto se vende en una tienda externa. El vendedor puede recibir una comisión si compras usando este enlace.
          </div>
        </div>
      </section>
    </main>
  );
}
