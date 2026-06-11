import Link from "next/link";
import { ArrowRight, BrainCircuit, ContactRound, Layers3, Megaphone, Sparkles } from "lucide-react";
import { HomeAuthRedirect } from "@/components/HomeAuthRedirect";

const scenes = [
  {
    eyebrow: "Gestión centralizada",
    title: "Mantén todos tus anuncios y productos en un solo lugar.",
    description: "Organiza artículos afiliados, productos físicos y publicaciones de clasificados desde un panel preparado para vendedores.",
    image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=1400&auto=format&fit=crop",
    icon: Layers3
  },
  {
    eyebrow: "Catálogos y referidos",
    title: "Comparte catálogos personalizados y crea links de referido en segundos.",
    description: "Cada vendedor tiene su página pública. El cliente entra directo al catálogo correcto, sin pasar por otros gestores.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1400&auto=format&fit=crop",
    icon: Megaphone
  },
  {
    eyebrow: "Base de datos y contacto",
    title: "Convierte visitas en contactos con WhatsApp, correo y seguimiento.",
    description: "Guarda señales de interés, mide clics y facilita que el cliente hable contigo desde el producto que está viendo.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1400&auto=format&fit=crop",
    icon: ContactRound
  }
];

export default function HomePage() {
  return (
    <main className="bg-[#f7f8fb] text-slate-950">
      <HomeAuthRedirect />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-black text-slate-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/afilyshop-icon.png" alt="AfilyShop" className="size-10 rounded-2xl object-cover" />
            AfilyShop
          </Link>
          <nav className="flex items-center gap-2 text-sm font-black">
            <Link href="/login" className="hidden rounded-2xl px-4 py-2 text-slate-700 hover:bg-slate-100 sm:inline-flex">Iniciar sesión</Link>
            <Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-white">
              Empezar a vender <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative grid min-h-screen place-items-center overflow-hidden px-5 pt-24">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1800&auto=format&fit=crop" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-white/80" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1fr_.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-brand-600 shadow-soft ring-1 ring-slate-200">
              <BrainCircuit size={18} /> Inteligencia + marketing para vendedores
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-none tracking-normal text-slate-950 md:text-7xl">
              Mantén tus artículos organizados.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-600">
              Crea una página pública para tus productos, enlaces de afiliado y contactos. Todo pensado para vender mejor y compartir más rápido.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 font-black text-white hover:bg-brand-700">
                Crear cuenta <ArrowRight />
              </Link>
              <Link href="/login" className="inline-flex items-center rounded-2xl bg-white px-6 py-4 font-black text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-2xl">
            <div className="h-full overflow-hidden rounded-[1.5rem] bg-white">
              <div className="bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">Mi catálogo</span>
                  <Sparkles className="text-emerald-300" size={18} />
                </div>
                <div className="mt-8 text-3xl font-black">Yuca Frita Store</div>
                <div className="mt-2 text-sm text-slate-300">Productos, referidos y contactos.</div>
              </div>
              <div className="grid gap-3 p-4">
                {["Batería portátil", "Oferta para WhatsApp", "Link referido"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="grid size-12 place-items-center rounded-xl bg-brand-100 font-black text-brand-600">{index + 1}</div>
                    <div>
                      <div className="font-black">{item}</div>
                      <div className="text-xs font-semibold text-slate-400">{index === 0 ? "Publicado" : "Listo para compartir"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="sticky top-20 mb-8 rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft md:p-8">
          <p className="font-black uppercase tracking-wide text-emerald-300">Onboarding</p>
          <h2 className="mt-2 text-3xl font-black md:text-5xl">Tres movimientos para ordenar, compartir y vender.</h2>
        </div>

        <div className="grid gap-8">
          {scenes.map((scene, index) => (
            <article key={scene.title} className="sticky top-36 grid min-h-[72vh] gap-6 overflow-hidden rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-slate-100 md:grid-cols-[.9fr_1.1fr] md:items-center md:p-8" style={{ zIndex: index + 1 }}>
              <div>
                <div className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <scene.icon />
                </div>
                <p className="font-black uppercase tracking-wide text-brand-600">{scene.eyebrow}</p>
                <h3 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{scene.title}</h3>
                <p className="mt-5 text-lg leading-8 text-slate-600">{scene.description}</p>
              </div>
              <div className="relative h-[360px] overflow-hidden rounded-[1.5rem] bg-slate-100 md:h-[520px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={scene.image} alt={scene.eyebrow} className="h-full w-full object-cover" />
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/92 p-4 shadow-soft backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-slate-950">Paso {index + 1}</div>
                      <div className="text-xs font-semibold text-slate-500">Optimizado para ventas reales</div>
                    </div>
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${((index + 1) / scenes.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-soft ring-1 ring-slate-100 md:p-12">
          <p className="font-black uppercase tracking-wide text-brand-600">Listo para empezar</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            Crea tu página y comparte tu primer catálogo.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Después del registro configuraremos logo, descripción, teléfono, correo y tu enlace personalizado.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">
              Iniciar <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
