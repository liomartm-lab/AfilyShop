import Link from "next/link";
import { Search, ShieldCheck, Sparkles } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-black text-brand-600">
          <span className="grid size-9 place-items-center rounded-2xl bg-brand-600 text-white">A</span>
          Affiliate Shop
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <Link href="/">Inicio</Link>
          <a href="#categorias">Categorías</a>
          <a href="#ofertas">Ofertas</a>
          <Link href="/dashboard" className="rounded-full bg-slate-900 px-4 py-2 text-white">Dashboard</Link>
        </nav>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 text-white">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_25%),radial-gradient(circle_at_80%_0%,white,transparent_20%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
            <Sparkles size={16} /> Plataforma para vendedores
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Crea tu tienda pública con enlaces afiliados y productos propios.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            Cada usuario puede tener un catálogo en su propio enlace, personalizar su marca, publicar productos y medir clics desde su dashboard.
          </p>
          <div className="mt-8 flex max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-soft">
            <div className="flex flex-1 items-center gap-2 px-4 text-slate-500">
              <Search size={18} />
              <input className="w-full outline-none" placeholder="Buscar celulares, baterías, TVs, herramientas..." />
            </div>
            <button className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white">Buscar</button>
          </div>
        </div>
        <div className="rounded-[2rem] bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur">
          <div className="rounded-[1.5rem] bg-white p-6 text-slate-900 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black">Flujo automático</h3>
              <ShieldCheck className="text-emerald-500" />
            </div>
            {[
              "El vendedor crea su cuenta",
              "Configura nombre, logo y colores",
              "Publica enlaces afiliados o productos propios",
              "Comparte su tienda y mide los clics"
            ].map((item, index) => (
              <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <span className="grid size-8 place-items-center rounded-full bg-brand-100 font-black text-brand-600">{index + 1}</span>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
