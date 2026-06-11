import { Header, Hero } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { getPublishedProducts } from "@/lib/products";
import { BarChart3, Link2, PackagePlus, Store } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getPublishedProducts();
  const stores = new Set(products.map((product) => product.store)).size;
  const totalClicks = products.reduce((sum, item) => sum + item.clicks, 0);
  const stats = [
    { label: "Productos publicados", value: products.length, icon: PackagePlus },
    { label: "Tiendas externas", value: stores, icon: Store },
    { label: "Clics registrados", value: totalClicks, icon: BarChart3 },
    { label: "Rutas afiliadas", value: products.length, icon: Link2 }
  ];

  return (
    <main>
      <Header />
      <Hero />

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-100">
              <stat.icon className="mb-3 text-brand-600" />
              <div className="text-3xl font-black">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="ofertas" className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="font-bold uppercase tracking-wide text-brand-600">Catálogo</p>
            <h2 className="text-3xl font-black text-slate-950">Productos destacados</h2>
          </div>
          <a href="/admin" className="hidden rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white md:block">Agregar producto</a>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section id="categorias" className="mx-auto max-w-7xl px-5 py-12">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-soft md:p-10">
          <h2 className="text-3xl font-black">Categorías iniciales</h2>
          <p className="mt-3 max-w-2xl text-slate-300">Puedes empezar con productos que ya trabajas: energía portátil, televisores, celulares, computadoras, herramientas y cámaras.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {["Energía portátil", "Televisores", "Celulares", "Computadoras", "Herramientas", "Cámaras"].map((category) => (
              <span key={category} className="rounded-full bg-white/10 px-4 py-2 font-semibold ring-1 ring-white/10">{category}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-sm font-semibold text-slate-500">
        AfiliShop Starter © 2026 · Algunos enlaces pueden generar comisión de afiliado.
      </footer>
    </main>
  );
}
