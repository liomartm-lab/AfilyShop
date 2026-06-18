"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore/lite";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Product } from "@/data/products";
import { auth, db, keepSessionInBrowser, storage } from "@/lib/firebase";
import { createProduct, getProductsByOwner, updateProductCategory } from "@/lib/products";
import { createDefaultStore, getStoreByOwnerId, updateStore, type StoreCategory, type StoreProfile } from "@/lib/stores";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  Copy,
  ExternalLink,
  Grid2X2,
  LayoutDashboard,
  List,
  Loader2,
  LogOut,
  MousePointerClick,
  PackagePlus,
  Palette,
  Plus,
  Save,
  Search,
  Settings,
  Store,
  Tags,
  Upload,
  Users,
  WandSparkles
} from "lucide-react";

type AnalyzeResult = {
  title: string;
  description: string;
  image: string;
  images?: string[];
  price: string | null;
  stock?: string;
  deliveryTime?: string;
  originalUrl: string;
  affiliateUrl: string;
  store: string;
  blocked?: boolean;
  warning?: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
};

type DashboardTab = "overview" | "profile" | "store" | "products" | "categories" | "marketing" | "analytics";

const tabs: Array<{ id: DashboardTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "products", label: "Productos", icon: Boxes },
  { id: "categories", label: "Categorias", icon: Tags },
  { id: "marketing", label: "Clientes", icon: Users },
  { id: "analytics", label: "Analitica", icon: BarChart3 },
  { id: "store", label: "Tienda", icon: Store },
  { id: "profile", label: "Configuracion", icon: Settings }
];

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productView, setProductView] = useState<"list" | "grid">("grid");
  const [showProductForm, setShowProductForm] = useState(false);
  const [productMode, setProductMode] = useState<"affiliate" | "physical">("affiliate");
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [category, setCategory] = useState("General");
  const [productKeywords, setProductKeywords] = useState("");
  const [productAttributes, setProductAttributes] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", icon: "tag", imageUrl: "" });
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", interest: "" });
  const [physicalProduct, setPhysicalProduct] = useState({
    title: "",
    description: "",
    price: "",
    image: "",
    stock: "En existencia",
    deliveryTime: ""
  });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const publicUrl = useMemo(() => {
    if (!store) return "";
    if (typeof window === "undefined") return `/${store.username}`;
    return `${window.location.origin}/${store.username}`;
  }, [store]);

  const categories = useMemo(() => {
    const unique = new Map<string, number>();
    products.forEach((product) => unique.set(product.category, (unique.get(product.category) || 0) + 1));
    return Array.from(unique.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const totalClicks = products.reduce((sum, product) => sum + product.clicks, 0);
  const topProduct = [...products].sort((a, b) => b.clicks - a.clicks)[0];
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !term || [product.title, product.category, product.store, ...(product.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesCategory = productCategoryFilter === "all" || product.category === productCategoryFilter;
      const matchesType = productTypeFilter === "all" || product.productType === productTypeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [productCategoryFilter, productSearch, productTypeFilter, products]);
  const chartData: Array<{ id: string; clicks: number }> = products.length
    ? products.slice(0, 9).map((product) => ({ id: product.id, clicks: product.clicks }))
    : Array.from({ length: 7 }, (_, index) => ({ id: `empty-${index}`, clicks: 12 + index * 9 }));

  function parseKeywords(value: string) {
    return Array.from(new Set(value.split(",").map((item) => item.trim()).filter(Boolean)));
  }

  function parseAttributes(value: string) {
    return Object.fromEntries(
      value
        .split("\n")
        .map((line) => line.split(":"))
        .filter(([key, ...rest]) => key.trim() && rest.join(":").trim())
        .map(([key, ...rest]) => [key.trim(), rest.join(":").trim()])
    );
  }

  function formatAttributes(attributes: Record<string, string>) {
    return Object.entries(attributes).map(([key, value]) => `${key}: ${value}`).join("\n");
  }

  async function loadSellerData(currentUser: User) {
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
    setProducts(await getProductsByOwner(currentUser.uid));
    await loadCustomers(currentUser.uid);
  }

  async function loadCustomers(ownerId: string) {
    if (!db) return;

    const snapshot = await getDocs(query(collection(db, "customers"), where("ownerId", "==", ownerId)));
    setCustomers(snapshot.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        name: String(data.name || ""),
        phone: String(data.phone || ""),
        email: String(data.email || ""),
        interest: String(data.interest || "")
      };
    }));
  }

  useEffect(() => {
    if (!auth) {
      setError("Firebase no esta configurado");
      setLoading(false);
      return;
    }

    keepSessionInBrowser();

    return onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
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

  async function saveStore(nextSetupComplete = store?.setupComplete || false, storeOverride?: StoreProfile) {
    const storeToSave = storeOverride || store;
    if (!user || !storeToSave) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateStore(user.uid, {
        ownerName: storeToSave.ownerName,
        name: storeToSave.name,
        username: storeToSave.username,
        logoUrl: storeToSave.logoUrl,
        description: storeToSave.description,
        contactEmail: storeToSave.contactEmail,
        phone: storeToSave.phone,
        theme: storeToSave.theme,
        categories: storeToSave.categories,
        setupComplete: nextSetupComplete
      });

      setStore(updated);
      setMessage("Cambios guardados.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setWorking(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!user || !store || !storage) return setError("Firebase Storage no esta configurado");

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const logoRef = ref(storage, `stores/${user.uid}/logo-${Date.now()}-${file.name}`);
      await uploadBytes(logoRef, file);
      const logoUrl = await getDownloadURL(logoRef);
      setStore({ ...store, logoUrl });
      setMessage("Logo subido. Guarda la tienda para conservarlo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el logo");
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
      setProductKeywords("");
      setProductAttributes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setWorking(false);
    }
  }

  async function suggestProductAttributes() {
    const source = result || physicalProduct;
    if (!source.title) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/suggest-attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: source.title, description: source.description, category })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron sugerir atributos");
      setProductKeywords((data.keywords || []).join(", "));
      setProductAttributes(formatAttributes(data.attributes || {}));
      setMessage("Sugerencias aplicadas. Puedes editarlas antes de publicar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron sugerir atributos");
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
        category,
        keywords: parseKeywords(productKeywords),
        attributes: parseAttributes(productAttributes)
      });

      setProducts(await getProductsByOwner(user.uid));
      setResult(null);
      setUrl("");
      setProductKeywords("");
      setProductAttributes("");
      setMessage("Producto publicado en tu tienda.");
      setActiveTab("products");
      setShowProductForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el producto");
    } finally {
      setWorking(false);
    }
  }

  async function publishPhysicalProduct() {
    if (!user || !store || !physicalProduct.title) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      await createProduct({
        productType: "physical",
        ownerId: user.uid,
        storeId: store.id,
        title: physicalProduct.title,
        description: physicalProduct.description,
        image: physicalProduct.image,
        images: physicalProduct.image ? [physicalProduct.image] : [],
        price: physicalProduct.price || null,
        stock: physicalProduct.stock,
        deliveryTime: physicalProduct.deliveryTime,
        originalUrl: publicUrl || "https://afilyshop.local",
        affiliateUrl: publicUrl || "https://afilyshop.local",
        store: store.name,
        category,
        keywords: parseKeywords(productKeywords),
        attributes: parseAttributes(productAttributes)
      });

      setProducts(await getProductsByOwner(user.uid));
      setPhysicalProduct({ title: "", description: "", price: "", image: "", stock: "En existencia", deliveryTime: "" });
      setProductKeywords("");
      setProductAttributes("");
      setMessage("Producto fisico publicado.");
      setShowProductForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar el producto fisico");
    } finally {
      setWorking(false);
    }
  }

  async function addCategory() {
    if (!store || !newCategory.name.trim()) return;

    const category: StoreCategory = {
      id: crypto.randomUUID(),
      name: newCategory.name.trim(),
      icon: newCategory.icon,
      imageUrl: newCategory.imageUrl
    };

    const updatedStore = { ...store, categories: [...store.categories, category] };
    setStore(updatedStore);
    setNewCategory({ name: "", icon: "tag", imageUrl: "" });
    await saveStore(true, updatedStore);
  }

  async function moveProductToCategory(productId: string, categoryName: string) {
    setWorking(true);
    setError("");
    setMessage("");

    try {
      await updateProductCategory(productId, categoryName);
      if (user) setProducts(await getProductsByOwner(user.uid));
      setMessage(`Producto movido a ${categoryName}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo mover el producto");
    } finally {
      setWorking(false);
    }
  }

  async function addCustomer() {
    if (!user || !db || !newCustomer.name.trim()) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      await addDoc(collection(db, "customers"), {
        ownerId: user.uid,
        storeId: store?.id || user.uid,
        ...newCustomer,
        createdAt: serverTimestamp()
      });
      await loadCustomers(user.uid);
      setNewCustomer({ name: "", phone: "", email: "", interest: "" });
      setMessage("Cliente guardado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el cliente");
    } finally {
      setWorking(false);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setMessage("Link copiado.");
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    router.replace("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fb]">
        <Loader2 className="animate-spin text-brand-600" size={36} />
      </main>
    );
  }

  return (
    <main className="admin-shell min-h-screen bg-[#f8fafc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/afilyshop-icon.png" alt="AfilyShop" className="size-9 rounded-lg object-cover" />
          <div>
            <div className="text-lg font-bold text-blue-700">AfilyShop</div>
            <div className="text-xs font-medium text-slate-500">Panel de vendedor</div>
          </div>
        </Link>
        <nav className="flex-1 py-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id !== "products") setShowProductForm(false);
              }}
              className={`relative flex w-full items-center gap-3 px-5 py-3 text-left text-sm font-semibold transition ${
                activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {activeTab === tab.id && <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />}
              <tab.icon size={19} strokeWidth={1.8} /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {(store?.ownerName || user?.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{store?.ownerName || "Vendedor"}</div>
              <div className="truncate text-xs text-slate-500">{store?.plan || "free"}</div>
            </div>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600">
            <LogOut size={17} /> Cerrar sesion
          </button>
        </div>
      </aside>

      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/afilyshop-icon.png" alt="AfilyShop" className="size-8 rounded-lg object-cover" />
            <span className="font-bold text-blue-700">AfilyShop</span>
          </Link>
          <div className="hidden max-w-md flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
            <Search size={17} className="text-slate-400" />
            <input
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
              onFocus={() => {
                setActiveTab("products");
                setShowProductForm(false);
              }}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Buscar productos..."
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="grid size-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100" title="Notificaciones">
              <Bell size={19} />
            </button>
            {store && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 sm:inline-flex">
                Ver tienda <ExternalLink size={15} />
              </a>
            )}
            <button
              onClick={() => {
                setActiveTab("products");
                setShowProductForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} /> <span className="hidden sm:inline">Agregar producto</span>
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-6 md:px-6 lg:pb-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                AfilyShop <ChevronRight size={14} /> <span className="text-blue-700">{showProductForm ? "Nuevo producto" : tabs.find((tab) => tab.id === activeTab)?.label}</span>
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">
                {showProductForm ? "Nuevo producto" : activeTab === "overview" ? "Dashboard de la tienda" : tabs.find((tab) => tab.id === activeTab)?.label}
              </h1>
              {activeTab === "products" && !showProductForm && <p className="mt-1 text-sm text-slate-500">Gestiona tu inventario y enlaces de afiliados.</p>}
            </div>
            {showProductForm && (
              <button onClick={() => setShowProductForm(false)} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                Volver al inventario
              </button>
            )}
          </div>

          {(error || message) && (
            <div className={`mb-6 rounded-md border p-4 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error || message}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Productos", value: products.length, icon: Boxes, detail: `${products.filter((item) => item.productType === "affiliate").length} afiliados` },
                  { label: "Clientes", value: customers.length, icon: Users, detail: "Contactos registrados" },
                  { label: "Clics en enlaces", value: totalClicks, icon: MousePointerClick, detail: topProduct ? `Lider: ${topProduct.title}` : "Sin actividad" },
                  { label: "Categorias", value: categories.length, icon: Tags, detail: `Plan ${store?.plan || "free"}` }
                ].map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-semibold uppercase text-slate-500">{metric.label}</div>
                      <metric.icon size={20} className="text-blue-600" />
                    </div>
                    <div className="mt-5 text-3xl font-bold text-slate-950">{metric.value}</div>
                    <div className="mt-1 truncate text-xs text-slate-500">{metric.detail}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">Rendimiento de clics</h2>
                      <p className="mt-1 text-sm text-slate-500">Distribucion actual entre tus productos publicados.</p>
                    </div>
                    <button onClick={() => setActiveTab("analytics")} className="text-sm font-semibold text-blue-700">Ver analitica</button>
                  </div>
                  <div className="mt-8 flex h-56 items-end gap-3 border-b border-l border-slate-200 px-4">
                    {chartData.map((product) => {
                      const clicks = product.clicks;
                      const maxClicks = Math.max(1, ...products.map((item) => item.clicks));
                      const height = products.length ? Math.max(10, Math.round((clicks / maxClicks) * 100)) : clicks;
                      return <div key={product.id} className="min-w-0 flex-1 rounded-t-sm bg-blue-500/70" style={{ height: `${height}%` }} />;
                    })}
                  </div>
                  <div className="mt-3 flex justify-between text-xs font-medium text-slate-400">
                    <span>Menor actividad</span><span>Productos</span><span>Mayor actividad</span>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold">Acciones rapidas</h2>
                  <div className="mt-4 grid gap-2">
                    {[
                      { label: "Agregar producto", detail: "Nuevo item al inventario", icon: PackagePlus, action: () => { setActiveTab("products"); setShowProductForm(true); } },
                      { label: "Gestionar clientes", detail: "Contactos y seguimiento", icon: Users, action: () => setActiveTab("marketing") },
                      { label: "Editar tienda", detail: "Marca y apariencia", icon: Palette, action: () => setActiveTab("store") }
                    ].map((action) => (
                      <button key={action.label} onClick={action.action} className="flex items-center gap-3 rounded-md border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/40">
                        <span className="grid size-10 place-items-center rounded-md bg-blue-50 text-blue-700"><action.icon size={19} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">{action.label}</span>
                          <span className="block text-xs text-slate-500">{action.detail}</span>
                        </span>
                        <ChevronRight size={17} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold">Productos con mas actividad</h2>
                    <p className="text-sm text-slate-500">Los enlaces que reciben mas clics.</p>
                  </div>
                  <button onClick={() => setActiveTab("products")} className="text-sm font-semibold text-blue-700">Ver productos</button>
                </div>
                <ProductTable products={[...products].sort((a, b) => b.clicks - a.clicks).slice(0, 5)} publicUsername={store?.username || ""} compact />
              </section>
            </div>
          )}

          {activeTab === "profile" && store && (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
              <h2 className="text-2xl font-black">Perfil</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="text-sm font-black text-slate-700">Nombre del vendedor</span>
                  <input value={store.ownerName} onChange={(event) => setStore({ ...store, ownerName: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
                </label>
                <label>
                  <span className="text-sm font-black text-slate-700">Correo de cuenta</span>
                  <input value={user?.email || ""} disabled className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-500" />
                </label>
                <label>
                  <span className="text-sm font-black text-slate-700">Correo de contacto</span>
                  <input type="email" value={store.contactEmail} onChange={(event) => setStore({ ...store, contactEmail: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
                </label>
                <label>
                  <span className="text-sm font-black text-slate-700">Telefono / WhatsApp</span>
                  <input value={store.phone} onChange={(event) => setStore({ ...store, phone: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="+1 555 000 0000" />
                </label>
              </div>
              <button onClick={() => saveStore(true)} disabled={working} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white disabled:opacity-60">
                {working ? <Loader2 className="animate-spin" /> : <Save />} Guardar perfil
              </button>
            </section>
          )}

          {activeTab === "store" && store && (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
              <h2 className="text-2xl font-black">Tienda</h2>
              <div className="mt-5 grid gap-4">
                <label>
                  <span className="text-sm font-black text-slate-700">Nombre de la tienda</span>
                  <input value={store.name} onChange={(event) => setStore({ ...store, name: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
                </label>
                <label>
                  <span className="text-sm font-black text-slate-700">Usuario publico</span>
                  <input value={store.username} onChange={(event) => setStore({ ...store, username: event.target.value })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
                </label>
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={store.logoUrl} alt="Logo" className="size-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-2xl bg-brand-50 font-black text-brand-600">A</div>
                  )}
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">
                    <Upload size={16} /> Subir logo
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => event.target.files?.[0] && uploadLogo(event.target.files[0])} />
                  </label>
                </div>
                <label>
                  <span className="text-sm font-black text-slate-700">Descripcion</span>
                  <textarea value={store.description} onChange={(event) => setStore({ ...store, description: event.target.value })} className="mt-2 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" />
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="text-sm font-black text-slate-700">Color principal</span>
                    <input type="color" value={store.theme.primaryColor} onChange={(event) => setStore({ ...store, theme: { ...store.theme, primaryColor: event.target.value } })} className="mt-2 h-14 w-full rounded-2xl border border-slate-200 p-2" />
                  </label>
                  <label>
                    <span className="text-sm font-black text-slate-700">Color acento</span>
                    <input type="color" value={store.theme.accentColor} onChange={(event) => setStore({ ...store, theme: { ...store.theme, accentColor: event.target.value } })} className="mt-2 h-14 w-full rounded-2xl border border-slate-200 p-2" />
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <label>
                    <span className="text-sm font-black text-slate-700">Tipografía</span>
                    <select value={store.theme.font} onChange={(event) => setStore({ ...store, theme: { ...store.theme, font: event.target.value } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none">
                      <option value="Inter">Inter</option>
                      <option value="System">System</option>
                      <option value="Serif">Serif premium</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-black text-slate-700">Diseño</span>
                    <select value={store.theme.layout} onChange={(event) => setStore({ ...store, theme: { ...store.theme, layout: event.target.value } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none">
                      <option value="grid">Cuadrícula</option>
                      <option value="editorial">Editorial</option>
                      <option value="compact">Compacto</option>
                    </select>
                  </label>
                  <label>
                    <span className="text-sm font-black text-slate-700">Textura</span>
                    <select value={store.theme.texture} onChange={(event) => setStore({ ...store, theme: { ...store.theme, texture: event.target.value } })} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none">
                      <option value="clean">Limpio</option>
                      <option value="paper">Papel suave</option>
                      <option value="grid">Malla sutil</option>
                    </select>
                  </label>
                </div>
              </div>
              <button onClick={() => saveStore(true)} disabled={working} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white disabled:opacity-60">
                {working ? <Loader2 className="animate-spin" /> : <Save />} Guardar tienda
              </button>
            </section>
          )}

          {activeTab === "products" && (
            showProductForm ? (
              <section className="rounded-lg border border-slate-200 bg-white p-5 md:p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-lg font-semibold">Informacion del producto</h2>
                    <p className="mt-1 text-sm text-slate-500">Crea un producto afiliado desde un enlace o agrega un producto fisico.</p>
                  </div>
                  <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
                    <button onClick={() => setProductMode("affiliate")} className={`rounded px-4 py-2 text-sm font-semibold ${productMode === "affiliate" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Afiliado</button>
                    <button onClick={() => setProductMode("physical")} className={`rounded px-4 py-2 text-sm font-semibold ${productMode === "physical" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>Fisico</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {productMode === "affiliate" ? (
                    <>
                      <input value={url} onChange={(event) => setUrl(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-950 outline-none ring-brand-100 focus:ring-4" placeholder="https://tienda.com/producto" />
                      <button onClick={analyzeUrl} disabled={working || !url} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-4 font-black text-white hover:bg-brand-700 disabled:opacity-60">
                        {working ? <Loader2 className="animate-spin" /> : <WandSparkles />} Analizar enlace
                      </button>
                    </>
                  ) : (
                    <div className="grid gap-3">
                      <input value={physicalProduct.title} onChange={(event) => setPhysicalProduct({ ...physicalProduct, title: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Nombre del producto" />
                      <textarea value={physicalProduct.description} onChange={(event) => setPhysicalProduct({ ...physicalProduct, description: event.target.value })} className="min-h-24 rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Descripción" />
                      <div className="grid gap-3 md:grid-cols-3">
                        <input value={physicalProduct.price} onChange={(event) => setPhysicalProduct({ ...physicalProduct, price: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Precio" />
                        <input value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Categoría" />
                        <input value={physicalProduct.stock} onChange={(event) => setPhysicalProduct({ ...physicalProduct, stock: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Stock" />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={physicalProduct.image} onChange={(event) => setPhysicalProduct({ ...physicalProduct, image: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="URL de imagen" />
                        <input value={physicalProduct.deliveryTime} onChange={(event) => setPhysicalProduct({ ...physicalProduct, deliveryTime: event.target.value })} className="rounded-2xl border border-slate-200 px-4 py-4 outline-none ring-brand-100 focus:ring-4" placeholder="Entrega" />
                      </div>
                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                        <label>
                          <span className="text-xs font-black text-slate-500">Palabras clave</span>
                          <input value={productKeywords} onChange={(event) => setProductKeywords(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="iphone, 128gb, azul" />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-500">Atributos filtrables</span>
                          <textarea value={productAttributes} onChange={(event) => setProductAttributes(event.target.value)} className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-brand-100 focus:ring-4" placeholder={"RAM: 8 GB\nPantalla: 6.1 pulgadas"} />
                        </label>
                        <button onClick={suggestProductAttributes} disabled={working || !physicalProduct.title} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-black text-slate-950 ring-1 ring-slate-200 disabled:opacity-60 md:col-span-2">
                          {working ? <Loader2 className="animate-spin" /> : <WandSparkles />} Sugerir palabras y atributos con IA
                        </button>
                      </div>
                      <button onClick={publishPhysicalProduct} disabled={working || !physicalProduct.title} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:opacity-60">
                        {working ? <Loader2 className="animate-spin" /> : <PackagePlus />} Publicar producto fisico
                      </button>
                    </div>
                  )}

                  {result && (
                    <div className="rounded-3xl bg-white p-5 text-slate-950">
                      {result.warning && (
                        <div className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800 ring-1 ring-amber-100">
                          {result.warning}
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.image || "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=800"} alt={result.title} className="h-44 w-full rounded-2xl object-cover" />
                        <div>
                          <p className="text-xs font-bold uppercase text-slate-400">{result.store}</p>
                          <label className="mt-2 block">
                            <span className="text-xs font-black text-slate-500">Titulo</span>
                            <input value={result.title} onChange={(event) => setResult({ ...result, title: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 font-black outline-none ring-brand-100 focus:ring-4" />
                          </label>
                          <label className="mt-3 block">
                            <span className="text-xs font-black text-slate-500">Descripcion</span>
                            <textarea value={result.description} onChange={(event) => setResult({ ...result, description: event.target.value })} className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-brand-100 focus:ring-4" />
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <label>
                          <span className="text-xs font-black text-slate-500">Precio</span>
                          <input value={result.price || ""} onChange={(event) => setResult({ ...result, price: event.target.value || null })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="99.99" />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-500">Categoria</span>
                          <input value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="Categoria" />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-500">Imagen URL</span>
                          <input value={result.image} onChange={(event) => setResult({ ...result, image: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="https://..." />
                        </label>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label>
                          <span className="text-xs font-black text-slate-500">Stock</span>
                          <input value={result.stock || ""} onChange={(event) => setResult({ ...result, stock: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="En existencia" />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-500">Tiempo de entrega</span>
                          <input value={result.deliveryTime || ""} onChange={(event) => setResult({ ...result, deliveryTime: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="Entrega estimada" />
                        </label>
                      </div>
                      <label className="mt-3 block">
                        <span className="text-xs font-black text-slate-500">Fotos adicionales, una URL por linea</span>
                        <textarea value={(result.images || []).join("\n")} onChange={(event) => setResult({ ...result, images: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })} className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-brand-100 focus:ring-4" />
                      </label>
                      <label className="mt-3 block">
                        <span className="text-xs font-black text-slate-500">Link afiliado final</span>
                        <input value={result.affiliateUrl} onChange={(event) => setResult({ ...result, affiliateUrl: event.target.value })} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" />
                      </label>
                      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                        <label>
                          <span className="text-xs font-black text-slate-500">Palabras clave</span>
                          <input value={productKeywords} onChange={(event) => setProductKeywords(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-brand-100 focus:ring-4" placeholder="ecoflow, bateria, solar" />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-500">Atributos filtrables</span>
                          <textarea value={productAttributes} onChange={(event) => setProductAttributes(event.target.value)} className="mt-1 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-brand-100 focus:ring-4" placeholder={"Capacidad: 286 Wh\nUso: Respaldo"} />
                        </label>
                        <button onClick={suggestProductAttributes} disabled={working || !result.title} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-black text-slate-950 ring-1 ring-slate-200 disabled:opacity-60 md:col-span-2">
                          {working ? <Loader2 className="animate-spin" /> : <WandSparkles />} Sugerir palabras y atributos con IA
                        </button>
                      </div>
                      <button onClick={publishProduct} disabled={working} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-white hover:bg-emerald-600 disabled:opacity-60">
                        {working ? <Loader2 className="animate-spin" /> : <PackagePlus />} Publicar en mi tienda
                      </button>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="px-5 pt-5">
                    <h2 className="text-xl font-semibold">Productos ({filteredProducts.length})</h2>
                    <p className="mt-1 text-sm text-slate-500">Arrastra un producto encima de una categoria para moverlo.</p>
                  </div>
                  <div className="flex items-center gap-1 px-5 pt-5">
                    <button onClick={() => setProductView("grid")} title="Vista en cuadricula" className={`grid size-9 place-items-center rounded-md border ${productView === "grid" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}><Grid2X2 size={17} /></button>
                    <button onClick={() => setProductView("list")} title="Vista en lista" className={`grid size-9 place-items-center rounded-md border ${productView === "list" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500"}`}><List size={17} /></button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 border-y border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[minmax(220px,1fr)_200px_180px_auto]">
                  <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3">
                    <Search size={16} className="text-slate-400" />
                    <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} className="min-h-10 w-full bg-transparent text-sm outline-none" placeholder="Buscar productos..." />
                  </label>
                  <select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 text-sm outline-none">
                    <option value="all">Todas las categorias</option>
                    {categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                  <select value={productTypeFilter} onChange={(event) => setProductTypeFilter(event.target.value)} className="rounded-md border border-slate-200 bg-white px-3 text-sm outline-none">
                    <option value="all">Todos los tipos</option>
                    <option value="affiliate">Afiliados</option>
                    <option value="physical">Fisicos</option>
                  </select>
                  <button onClick={() => setShowProductForm(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white">
                    <Plus size={16} /> Agregar
                  </button>
                </div>
                {productView === "list" ? (
                  <ProductTable products={filteredProducts} publicUsername={store?.username || ""} onCopy={copyText} />
                ) : (
                  <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <article key={product.id} draggable onDragStart={(event) => event.dataTransfer.setData("productId", product.id)} className="rounded-lg border border-slate-200 bg-white p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={product.imageUrl || "/afilyshop-icon.png"} alt={product.title} className="h-36 w-full rounded-md bg-slate-50 object-contain p-2" />
                        <div className="mt-3 text-xs font-semibold uppercase text-slate-400">{product.productType === "physical" ? "Fisico" : "Afiliado"} · {product.category}</div>
                        <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{product.title}</h3>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                          <button onClick={() => copyText(`${window.location.origin}/${store?.username}/product/${product.slug}`)} title="Copiar enlace" className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-600"><Copy size={15} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )
          )}

          {activeTab === "categories" && (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
              <h2 className="text-2xl font-black">Categorias</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Crea categorías con icono/foto y arrastra productos hacia ellas.</p>
              <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_160px_1fr_auto]">
                <input value={newCategory.name} onChange={(event) => setNewCategory({ ...newCategory, name: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Nombre de categoría" />
                <select value={newCategory.icon} onChange={(event) => setNewCategory({ ...newCategory, icon: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none">
                  <option value="tag">Etiqueta</option>
                  <option value="box">Caja</option>
                  <option value="bolt">Energía</option>
                  <option value="phone">Celular</option>
                  <option value="home">Hogar</option>
                </select>
                <input value={newCategory.imageUrl} onChange={(event) => setNewCategory({ ...newCategory, imageUrl: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Foto URL opcional" />
                <button onClick={addCategory} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white">Crear</button>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[...(store?.categories || []), ...categories.filter((item) => !(store?.categories || []).some((category) => category.name === item.name)).map((item) => ({ id: item.name, name: item.name, icon: "tag", imageUrl: "" }))].map((item) => (
                  <div
                    key={item.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      const productId = event.dataTransfer.getData("productId");
                      if (productId) moveProductToCategory(productId, item.name);
                    }}
                    className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt={item.name} className="size-12 rounded-xl object-cover" />
                        ) : (
                          <div className="grid size-12 place-items-center rounded-xl bg-white font-black text-brand-600">{item.icon.slice(0, 1).toUpperCase()}</div>
                        )}
                        <div>
                          <div className="font-black">{item.name}</div>
                          <div className="text-xs font-semibold text-slate-400">Suelta productos aquí</div>
                        </div>
                      </div>
                      <button onClick={() => copyText(`${window.location.origin}/${store?.username}/category/${encodeURIComponent(item.name)}`)} className="grid size-9 place-items-center rounded-xl bg-white text-slate-500"><Copy size={16} /></button>
                    </div>
                  </div>
                ))}
                {!categories.length && !store?.categories.length && <div className="rounded-2xl bg-slate-50 p-6 text-center font-semibold text-slate-400 md:col-span-2">Aun no hay categorias.</div>}
              </div>
            </section>
          )}

          {activeTab === "marketing" && (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
              <h2 className="text-2xl font-black">Marketing</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Registra clientes, intereses y datos de contacto para seguimiento.</p>
              <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
                <input value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Nombre del cliente" />
                <input value={newCustomer.phone} onChange={(event) => setNewCustomer({ ...newCustomer, phone: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Teléfono / WhatsApp" />
                <input value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Correo" />
                <input value={newCustomer.interest} onChange={(event) => setNewCustomer({ ...newCustomer, interest: event.target.value })} className="rounded-xl border border-slate-200 px-4 py-3 outline-none" placeholder="Interés del cliente" />
                <button onClick={addCustomer} disabled={working || !newCustomer.name} className="rounded-xl bg-slate-950 px-4 py-3 font-black text-white disabled:opacity-60 md:col-span-2">Guardar cliente</button>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr><th className="py-3">Cliente</th><th>Teléfono</th><th>Correo</th><th>Interés</th></tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id} className="border-t border-slate-100">
                        <td className="py-4 font-bold">{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.email}</td>
                        <td>{customer.interest}</td>
                      </tr>
                    ))}
                    {!customers.length && <tr><td colSpan={4} className="py-8 text-center font-semibold text-slate-400">Todavía no tienes clientes registrados.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "analytics" && (
            <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-100">
              <h2 className="text-2xl font-black">Analitica</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-sm font-black text-slate-400">Clics totales</div>
                  <div className="mt-2 text-4xl font-black">{totalClicks}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-sm font-black text-slate-400">Productos</div>
                  <div className="mt-2 text-4xl font-black">{products.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-5">
                  <div className="text-sm font-black text-slate-400">Mas clicado</div>
                  <div className="mt-2 line-clamp-2 text-lg font-black">{topProduct?.title || "Sin datos"}</div>
                </div>
              </div>
              <ProductTable products={products} publicUsername={store?.username || ""} compact />
            </section>
          )}
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 lg:hidden">
        {[
          tabs.find((tab) => tab.id === "overview"),
          tabs.find((tab) => tab.id === "products"),
          tabs.find((tab) => tab.id === "marketing"),
          tabs.find((tab) => tab.id === "analytics"),
          tabs.find((tab) => tab.id === "profile")
        ].filter(Boolean).map((tab) => {
          const mobileTab = tab!;
          const MobileIcon = mobileTab.icon;
          return (
            <button
              key={mobileTab.id}
              onClick={() => {
                setActiveTab(mobileTab.id);
                setShowProductForm(false);
              }}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold ${activeTab === mobileTab.id ? "text-blue-700" : "text-slate-500"}`}
            >
              <MobileIcon size={19} />
              <span className="truncate">{mobileTab.id === "profile" ? "Mas" : mobileTab.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function ProductTable({ products, publicUsername, compact = false, onCopy }: { products: Product[]; publicUsername: string; compact?: boolean; onCopy?: (value: string) => void }) {
  return (
    <div className={compact ? "overflow-x-auto" : "overflow-x-auto"}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-5 py-3">Producto</th>
            <th className="px-4 py-3">Categoria</th>
            {!compact && <th className="px-4 py-3">Tipo</th>}
            <th className="px-4 py-3">Precio</th>
            {!compact && <th className="px-4 py-3">Stock</th>}
            <th className="px-4 py-3">Clics</th>
            <th className="px-4 py-3">Estado</th>
            {!compact && <th className="px-4 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl || "/afilyshop-icon.png"} alt="" className="size-11 rounded-md border border-slate-200 bg-white object-contain p-1" />
                  <div className="min-w-0">
                    <div className="max-w-[280px] truncate font-semibold text-slate-950">{product.title}</div>
                    <div className="mt-0.5 max-w-[280px] truncate text-xs text-slate-400">{product.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600">{product.category}</td>
              {!compact && (
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-semibold ${product.productType === "physical" ? "bg-indigo-50 text-indigo-700" : "bg-cyan-50 text-cyan-700"}`}>
                    {product.productType === "physical" ? "Fisico" : "Afiliado"}
                  </span>
                </td>
              )}
              <td className="px-4 py-3 font-mono font-semibold">${product.price.toFixed(2)}</td>
              {!compact && <td className="px-4 py-3 text-slate-600">{product.stock || "No indicado"}</td>}
              <td className="px-4 py-3 font-medium">{product.clicks}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Publicado
                </span>
              </td>
              {!compact && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/${publicUsername}/product/${product.slug}`} target="_blank" rel="noopener noreferrer" title="Ver producto" className="grid size-8 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><ExternalLink size={15} /></Link>
                    {onCopy && <button onClick={() => onCopy(`${window.location.origin}/${publicUsername}/product/${product.slug}`)} title="Copiar enlace" className="grid size-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100"><Copy size={15} /></button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {!products.length && (
            <tr><td colSpan={compact ? 5 : 8} className="px-5 py-12 text-center font-medium text-slate-400">Todavia no tienes productos publicados.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
