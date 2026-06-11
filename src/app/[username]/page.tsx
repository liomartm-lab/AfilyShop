import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getPublishedProductsByOwner } from "@/lib/products";
import { getStoreByUsername } from "@/lib/stores";
import { Mail, MessageCircle, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const store = await getStoreByUsername(username);
  if (!store || store.status !== "active") notFound();

  const products = await getPublishedProductsByOwner(store.ownerId);
  const whatsappPhone = store.phone.replace(/\D/g, "");

  return (
    <main style={{ "--store-primary": store.theme.primaryColor, "--store-accent": store.theme.accentColor } as React.CSSProperties}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href={`/${store.username}`} className="flex items-center gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt={store.name} className="size-11 rounded-2xl object-cover" />
            ) : (
              <span className="grid size-11 place-items-center rounded-2xl text-lg font-black text-white" style={{ background: store.theme.primaryColor }}>
                {store.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div>
              <div className="text-lg font-black text-slate-950">{store.name}</div>
              <div className="text-xs font-bold text-slate-400">@{store.username}</div>
            </div>
          </Link>
          <Link href="/login" className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Crear mi tienda</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-8 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100 md:grid-cols-[1fr_auto] md:items-end md:p-8">
          <div>
            <p className="font-bold uppercase tracking-wide" style={{ color: store.theme.primaryColor }}>Catálogo del vendedor</p>
            <h1 className="mt-3 text-4xl font-black text-slate-950 md:text-5xl">{store.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">{store.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {whatsappPhone && (
                <a href={`https://wa.me/${whatsappPhone}`} target="_blank" className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-white" style={{ background: store.theme.accentColor }}>
                  <MessageCircle size={18} /> WhatsApp
                </a>
              )}
              {store.contactEmail && (
                <a href={`mailto:${store.contactEmail}`} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 font-black text-slate-700">
                  <Mail size={18} /> Correo
                </a>
              )}
            </div>
          </div>
          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-5 py-4 font-black text-slate-700">
            <ShoppingBag style={{ color: store.theme.accentColor }} /> {products.length} productos
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} productPath={`/${store.username}/product/${product.slug}`} />
          ))}
        </div>
        {!products.length && (
          <div className="rounded-[2rem] bg-white p-10 text-center font-semibold text-slate-400 shadow-soft ring-1 ring-slate-100">
            Esta tienda todavía no tiene productos publicados.
          </div>
        )}
      </section>
    </main>
  );
}
