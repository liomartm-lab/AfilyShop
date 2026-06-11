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
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href={`/${store.username}`} className="text-xl font-black text-slate-950">{store.name}</Link>
          <Link href={`/${store.username}`} className="text-sm font-bold text-slate-500">Volver al catálogo</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,520px)_1fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex h-[420px] items-center justify-center overflow-hidden rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageUrl || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop"} alt={product.title} className="max-h-full max-w-full object-contain" />
          </div>
          {!!product.images?.length && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image) => (
                <div key={image} className="flex h-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-soft ring-1 ring-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={product.title} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100 md:p-8">
          <span className="rounded-full px-4 py-2 text-sm font-black text-white" style={{ background: store.theme.primaryColor }}>{product.category}</span>
          <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl">{product.title}</h1>
          <div className="mt-6 text-4xl font-black">${product.price.toFixed(2)}</div>
          <p className="mt-2 text-sm font-semibold text-slate-400">Precio aproximado detectado desde tienda externa.</p>
          {(product.stock || product.deliveryTime) && (
            <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-5 text-sm font-black text-slate-700">
              {product.stock && <div>Stock: {product.stock}</div>}
              {product.deliveryTime && <div>Entrega: {product.deliveryTime}</div>}
            </div>
          )}
          <div className="mt-7 rounded-2xl bg-slate-50 p-5">
            <h2 className="font-black text-slate-950">Descripción</h2>
            <p className="mt-3 text-base leading-8 text-slate-600">{product.description}</p>
          </div>
          {product.productType !== "physical" && (
            <Link href={`/go/${product.id}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-black text-white md:w-auto" style={{ background: store.theme.primaryColor }}>
              Comprar ahora <ExternalLink />
            </Link>
          )}
          {whatsappPhone && (
            <a href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-lg font-black text-white md:w-auto ${product.productType !== "physical" ? "md:ml-3" : ""}`}>
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
