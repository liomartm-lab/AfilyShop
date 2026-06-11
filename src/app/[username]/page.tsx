import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontExplorer } from "@/components/StorefrontExplorer";
import { getPublishedProductsByOwner } from "@/lib/products";
import { getStoreByUsername } from "@/lib/stores";
import { Mail, MessageCircle, Search, ShoppingBag, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicStorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const store = await getStoreByUsername(username);
  if (!store || store.status !== "active") notFound();

  const products = await getPublishedProductsByOwner(store.ownerId);
  const whatsappPhone = store.phone.replace(/\D/g, "");
  const categoryNames = Array.from(new Set(products.map((product) => product.category)));

  return (
    <main className="min-h-screen bg-[#f7f8fb]" style={{ "--store-primary": store.theme.primaryColor, "--store-accent": store.theme.accentColor } as React.CSSProperties}>
      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-4">
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
          <Link href="/login" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Crear mi tienda</Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-5 py-8">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft lg:grid-cols-[1fr_420px] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black ring-1 ring-white/10">
              <Sparkles size={16} /> Catálogo exclusivo
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">{store.name}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">{store.description}</p>
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
            {!!categoryNames.length && (
              <div className="mt-7 flex flex-wrap gap-2">
                {categoryNames.map((category) => (
                  <span key={category} className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/10">
                    {category}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[1.5rem] bg-white p-5 text-slate-950">
            <div className="flex items-center gap-3">
              <ShoppingBag style={{ color: store.theme.accentColor }} />
              <div>
                <div className="text-3xl font-black">{products.length}</div>
                <div className="text-sm font-bold text-slate-400">productos publicados</div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-slate-500">
              <Search size={18} />
              <span className="text-sm font-semibold">Explora el catálogo</span>
            </div>
          </div>
        </div>
      </section>

      {products.length ? (
        <StorefrontExplorer products={products} username={store.username} categoryNames={categoryNames} />
      ) : (
        <section className="mx-auto max-w-[1600px] px-5 pb-14">
          <div className="rounded-[2rem] bg-white p-10 text-center font-semibold text-slate-400 shadow-soft ring-1 ring-slate-100">
            Esta tienda todavía no tiene productos publicados.
          </div>
        </section>
      )}
    </main>
  );
}
