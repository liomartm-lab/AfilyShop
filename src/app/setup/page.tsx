"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { createDefaultStore, getStoreByOwnerId, updateStore, type StoreProfile } from "@/lib/stores";
import { Bot, ExternalLink, Loader2, Save, Upload } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const publicUrl = useMemo(() => {
    if (!store || typeof window === "undefined") return "";
    return `${window.location.origin}/${store.username}`;
  }, [store]);

  useEffect(() => {
    if (!auth) {
      setError("Firebase no está configurado");
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login?mode=register");
        return;
      }

      setUser(currentUser);

      try {
        let currentStore = await getStoreByOwnerId(currentUser.uid);
        if (!currentStore) {
          currentStore = await createDefaultStore(
            currentUser.uid,
            currentUser.email || "usuario@email.com",
            currentUser.email?.split("@")[0],
            currentUser.displayName || "Vendedor"
          );
        }
        setStore(currentStore);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la configuración");
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  async function uploadLogo(file: File) {
    if (!user || !store || !storage) return setError("Firebase Storage no está configurado");

    setSaving(true);
    setError("");

    try {
      const logoRef = ref(storage, `stores/${user.uid}/logo-${Date.now()}-${file.name}`);
      await uploadBytes(logoRef, file);
      const logoUrl = await getDownloadURL(logoRef);
      setStore({ ...store, logoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el logo");
    } finally {
      setSaving(false);
    }
  }

  function generateDescription() {
    if (!store) return;

    setStore({
      ...store,
      description: `Bienvenido a ${store.name}. Aquí encontrarás una selección organizada de productos, recomendaciones y enlaces directos para comprar o contactarnos por WhatsApp.`
    });
  }

  async function finishSetup() {
    if (!user || !store) return;

    setSaving(true);
    setError("");

    try {
      await updateStore(user.uid, {
        name: store.name,
        username: store.username,
        logoUrl: store.logoUrl,
        description: store.description,
        contactEmail: store.contactEmail,
        phone: store.phone,
        theme: store.theme,
        setupComplete: true
      });

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo finalizar la configuración");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fb]">
        <Loader2 className="animate-spin text-brand-600" size={36} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-black text-slate-950">
            <span className="grid size-9 place-items-center rounded-2xl bg-brand-600 text-white">A</span>
            AfiliShop
          </Link>
          <span className="text-sm font-black text-brand-600">Configura tu tienda</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[.95fr_1.05fr]">
        <div>
          <p className="font-black uppercase tracking-wide text-brand-600">Paso final</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            Dale identidad a tu página antes de compartirla.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Esta información será visible para tus clientes. Tu enlace lleva únicamente a tu catálogo, no a otros gestores.
          </p>
          {publicUrl && (
            <a href={publicUrl} target="_blank" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-black text-brand-600 shadow-soft ring-1 ring-slate-100">
              {publicUrl} <ExternalLink size={16} />
            </a>
          )}
        </div>

        <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100 md:p-8">
          <div className="grid gap-5">
            <label>
              <span className="text-sm font-black text-slate-700">Nombre de la tienda</span>
              <input value={store?.name || ""} onChange={(event) => store && setStore({ ...store, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
            </label>

            <label>
              <span className="text-sm font-black text-slate-700">Usuario público</span>
              <input value={store?.username || ""} onChange={(event) => store && setStore({ ...store, username: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
            </label>

            <div>
              <span className="text-sm font-black text-slate-700">Logo</span>
              <div className="mt-2 flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                {store?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logoUrl} alt="Logo" className="size-16 rounded-2xl object-cover" />
                ) : (
                  <div className="grid size-16 place-items-center rounded-2xl bg-brand-50 font-black text-brand-600">A</div>
                )}
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                  <Upload size={16} /> Subir logo
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadLogo(event.target.files[0])} />
                </label>
                <button type="button" disabled className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-400">
                  <Bot size={16} /> Generar con IA
                </button>
              </div>
            </div>

            <label>
              <span className="text-sm font-black text-slate-700">Descripción</span>
              <textarea value={store?.description || ""} onChange={(event) => store && setStore({ ...store, description: event.target.value })} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
            </label>
            <button type="button" onClick={generateDescription} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-black text-brand-600">
              <Bot size={16} /> Generar descripción base
            </button>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-black text-slate-700">Teléfono / WhatsApp</span>
                <input value={store?.phone || ""} onChange={(event) => store && setStore({ ...store, phone: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="+1 555 000 0000" />
              </label>
              <label>
                <span className="text-sm font-black text-slate-700">Correo de contacto</span>
                <input type="email" value={store?.contactEmail || ""} onChange={(event) => store && setStore({ ...store, contactEmail: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
              </label>
            </div>

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

            {error && <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

            <button onClick={finishSetup} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Finalizar y entrar
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
