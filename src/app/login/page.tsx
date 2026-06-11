"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { Header } from "@/components/Header";
import { auth } from "@/lib/firebase";
import { createDefaultStore } from "@/lib/stores";
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return setError("Firebase no está configurado");

    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await createDefaultStore(credential.user.uid, credential.user.email || email, username);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <Header />
      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-bold uppercase tracking-wide text-brand-600">Affiliate Shop</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 md:text-5xl">
            Crea tu catálogo público y gestiona tus enlaces desde un solo lugar.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Cada vendedor tendrá su propio link, productos afiliados, productos físicos, tema visual y analítica.
          </p>
        </div>

        <form onSubmit={submitForm} className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100 md:p-8">
          <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-xl px-4 py-3 font-black ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
              Entrar
            </button>
            <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-xl px-4 py-3 font-black ${mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
              Crear cuenta
            </button>
          </div>

          {mode === "register" && (
            <label className="mb-4 block">
              <span className="text-sm font-black text-slate-700">Usuario público</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="miusuario" />
              <span className="mt-2 block text-xs font-semibold text-slate-400">Tu tienda será /{username || "miusuario"}</span>
            </label>
          )}

          <label className="mb-4 block">
            <span className="text-sm font-black text-slate-700">Correo</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="tu@email.com" required />
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">Contraseña</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Mínimo 6 caracteres" required />
          </label>

          {error && <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          <button disabled={loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
            {loading ? <Loader2 className="animate-spin" /> : mode === "login" ? <LogIn /> : <UserPlus />}
            {mode === "login" ? "Entrar al dashboard" : "Crear mi tienda"}
          </button>

          <Link href="/" className="mt-4 block text-center text-sm font-bold text-slate-500">Volver al inicio</Link>
        </form>
      </section>
    </main>
  );
}
