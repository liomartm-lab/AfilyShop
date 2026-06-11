"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import type { Product } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export function StorefrontExplorer({
  products,
  username,
  categoryNames
}: {
  products: Product[];
  username: string;
  categoryNames: string[];
}) {
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [activeAttribute, setActiveAttribute] = useState("");

  const attributeOptions = useMemo(() => {
    const values = new Set<string>();
    products.forEach((product) => {
      Object.entries(product.attributes || {}).forEach(([key, value]) => {
        if (value) values.add(`${key}: ${value}`);
      });
    });
    return Array.from(values).slice(0, 14);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const searchable = [
        product.title,
        product.description,
        product.category,
        product.store,
        ...(product.keywords || []),
        ...Object.entries(product.attributes || {}).flat()
      ].join(" ").toLowerCase();
      const categoryMatch = activeCategory === "Todos" || product.category === activeCategory;
      const attributeMatch = !activeAttribute || Object.entries(product.attributes || {}).some(([key, value]) => `${key}: ${value}` === activeAttribute);
      const searchMatch = !term || searchable.includes(term);

      return categoryMatch && attributeMatch && searchMatch;
    });
  }, [activeAttribute, activeCategory, products, search]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(draftSearch);
  }

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-14">
      <div className="mb-6 grid gap-4 rounded-[1.5rem] bg-white p-4 shadow-soft ring-1 ring-slate-100 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <form onSubmit={submitSearch} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-950 outline-none"
            placeholder="Buscar y presionar Enter"
          />
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setActiveCategory("Todos")} className={`rounded-full px-4 py-2 text-sm font-black ${activeCategory === "Todos" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>
            Todos
          </button>
          {categoryNames.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full px-4 py-2 text-sm font-black ${activeCategory === category ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`}>
              {category}
            </button>
          ))}
        </div>
      </div>

      {!!attributeOptions.length && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-slate-500 ring-1 ring-slate-100">
            <SlidersHorizontal size={16} /> Atributos
          </span>
          <button onClick={() => setActiveAttribute("")} className={`rounded-full px-4 py-2 text-sm font-bold ${!activeAttribute ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-100"}`}>
            Todos
          </button>
          {attributeOptions.map((attribute) => (
            <button key={attribute} onClick={() => setActiveAttribute(attribute)} className={`rounded-full px-4 py-2 text-sm font-bold ${activeAttribute === attribute ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-100"}`}>
              {attribute}
            </button>
          ))}
        </div>
      )}

      {(activeCategory !== "Todos" || search || activeAttribute) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => { setActiveCategory("Todos"); setSearch(""); setDraftSearch(""); setActiveAttribute(""); }} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-100">
            <ArrowLeft size={16} /> Ver todo
          </button>
          {activeCategory !== "Todos" && (
            <Link href={`/${username}/category/${encodeURIComponent(activeCategory)}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-brand-600 ring-1 ring-slate-100">
              Abrir categoría <ExternalLink size={16} />
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} productPath={`/${username}/product/${product.slug}`} />
        ))}
      </div>
      {!filteredProducts.length && (
        <div className="rounded-[2rem] bg-white p-10 text-center font-semibold text-slate-400 shadow-soft ring-1 ring-slate-100">
          No encontramos productos con esos filtros.
        </div>
      )}
    </section>
  );
}
