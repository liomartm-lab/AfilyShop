"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Header } from "@/components/Header";
import type { Product } from "@/data/products";
import { auth } from "@/lib/firebase";
import { createProduct, getProductsByOwner } from "@/lib/products";
import { createDefaultStore, getStoreByOwnerId, updateStore, type StoreProfile } from "@/lib/stores";
import { ExternalLink, Loader2, LogOut, PackagePlus, Save, WandSparkles } from "lucide-react";

type AnalyzeResult = {
  title: string;
  description: string;
  image: string;
  price: string | null;
  originalUrl: string;
  affiliateUrl: string;
  store: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const publicUrl = useMemo(() => {
    if (!store) return "";
    if (typeof window === "undefined") return `/${store.username}`;
    return `${window.location.origin}/${store.username}`;
  }, [store]);

  async function loadSellerData(currentUser: User) {
    let currentStore = await getStoreByOwnerId(currentUser.uid);
    if (!currentStore) {
      currentStore = await createDefaultStore(currentUser.uid, currentUser.email || "usuario@email.com");
    }

    setStore(currentStore);
    setProducts(await getProductsByOwner(currentUser.uid));
  }

  useEffect(() => {
    if (!auth) {
      setError("Firebase no está configurado");
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        await loadSellerData(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function saveStore() {
    if (!user || !store) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateStore(user.uid, {
        name: store.name,
        username: store.username,
        logoUrl: store.logoUrl,
        description: store.description,
        theme: store.theme
      });

      setStore(updated);
      setMessage("Tienda actualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la tienda");
    } finally {
      setWorking(false);
    }
  }

  async function analyzeUrl() {
    setWorking(true);
    setError("");
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo analizar el enlace");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setWorking(false);
    }
  }

  async function publishProduct() {
    if (!user || !store || !result) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      await createProduct({
        ...result,
        ownerId: user.uid,
        storeId: store.id,
        category
      });

      setProducts(await getProductsByOwner(user.uid));
      setResult(null);
      setUrl("");
      setMessage("Producto publicado en tu tienda.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el producto");
    } finally {
      setWorking(false);
    }
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    router.push("/login");
  }

  if (loading) {
    return (
      <main>
        <Header />
        <div className="grid min-h-[60vh] place-items-center">
          <Loader2 className="animate-spin text-brand-600" size={36} />
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-bold uppercase tracking-wide text-brand-600">Dashboard</p>
            <h1 className="text-4xl font-black text-slate-950">{store?.name || "Mi tienda"}</h1>
            {store && <a href={publicUrl} target="_blank" className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-brand-600">{publicUrl} <ExternalLink size={14} /></a>}
          </div>
          <button onClick={logout} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white">
            <LogOut size={18} /> Salir
          </button>
        </div>

        {(error || message) && (
          <div className={`mb-6 rounded-2xl p-4 text-sm font-semibold ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
            {error || message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
          <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
            <h2 className="text-2xl font-black">Configurar tienda</h2>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="text-sm font-black text-slate-700">Nombre</span>
                <input value={store?.name || ""} onChange={(event) => store && setStore({ ...store, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
              </label>
              <label>
                <span className="text-sm font-black text-slate-700">Usuario público</span>
                <input value={store?.username || ""} onChange={(event) => store && setStore({ ...store, username: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
              </label>
              <label>
                <span className="text-sm font-black text-slate-700">Logo por URL</span>
                <input value={store?.logoUrl || ""} onChange={(event) => store && setStore({ ...store, logoUrl: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="https://..." />
              </label>
              <label>
                <span className="text-sm font-black text-slate-700">Descripción</span>
                <textarea value={store?.description || ""} onChange={(event) => store && setStore({ ...store, description: event.target.value })} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-black text-slate-700">Color principal</span>
                  <input type="color" value={store?.theme.primaryColor || "#2563eb"} onChange={(event) => store && setStore({ ...store, theme: { ...store.theme, primaryColor: event.target.value } })} className="mt-2 h-14 w-full rounded-2xl border border-slate-200 p-2" />
                </label>
                <label>
                  <span className="text-sm font-black text-slate-700">Color acento</span>
                  <input type="color" value={store?.theme.accentColor || "#10b981"} onChange={(event) => store && setStore({ ...store, theme: { ...store.theme, accentColor: event.target.value } })} className="mt-2 h-14 w-full rounded-2xl border border-slate-200 p-2" />
                </label>
              </div>
              <button onClick={saveStore} disabled={working} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
                {working ? <Loader2 className="animate-spin" /> : <Save />} Guardar tienda
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-soft">
            <h2 className="text-2xl font-black">Agregar producto afiliado</h2>
            <div className="mt-5 grid gap-4">
              <input value={url} onChange={(event) => setUrl(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white px-4 py-4 text-slate-950 outline-none" placeholder="https://tienda.com/producto" />
              <button onClick={analyzeUrl} disabled={working || !url} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
                {working ? <Loader2 className="animate-spin" /> : <WandSparkles />} Analizar enlace
              </button>

              {result && (
                <div className="rounded-3xl bg-white p-5 text-slate-950">
                  <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.image || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800"} alt={result.title} className="h-44 w-full rounded-2xl object-cover" />
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">{result.store}</p>
                      <h3 className="mt-2 text-xl font-black">{result.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{result.description}</p>
                      <div className="mt-3 text-2xl font-black">{result.price || "Precio no detectado"}</div>
                    </div>
                  </div>
                  <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Categoría" />
                  <button onClick={publishProduct} disabled={working} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white hover:bg-emerald-600 disabled:opacity-60">
                    {working ? <Loader2 className="animate-spin" /> : <PackagePlus />} Publicar en mi tienda
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Mis productos</h2>
            <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-black text-brand-600">{products.length} publicados</span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr><th className="py-3">Producto</th><th>Categoría</th><th>Precio</th><th>Clics</th></tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="py-4 font-bold">{product.title}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.clicks}</td>
                  </tr>
                ))}
                {!products.length && (
                  <tr><td colSpan={4} className="py-8 text-center font-semibold text-slate-400">Todavía no tienes productos publicados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
