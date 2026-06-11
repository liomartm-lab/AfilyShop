import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getPublishedProductsByOwner } from "@/lib/products";
import { getStoreByUsername } from "@/lib/stores";

export const dynamic = "force-dynamic";

export default async function PublicCategoryPage({ params }: { params: Promise<{ username: string; category: string }> }) {
  const { username, category } = await params;
  const store = await getStoreByUsername(username);
  if (!store || store.status !== "active") notFound();

  const categoryName = decodeURIComponent(category);
  const products = (await getPublishedProductsByOwner(store.ownerId))
    .filter((product) => product.category.toLowerCase() === categoryName.toLowerCase());

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href={`/${store.username}`} className="text-xl font-black text-slate-950">{store.name}</Link>
          <Link href={`/${store.username}`} className="text-sm font-bold text-slate-500">Volver al catálogo</Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <p className="font-black uppercase tracking-wide" style={{ color: store.theme.primaryColor }}>Categoría</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">{categoryName}</h1>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} productPath={`/${store.username}/product/${product.slug}`} />
          ))}
        </div>
        {!products.length && (
          <div className="mt-8 rounded-[2rem] bg-white p-10 text-center font-semibold text-slate-400 shadow-soft ring-1 ring-slate-100">
            No hay productos en esta categoría.
          </div>
        )}
      </section>
    </main>
  );
}
