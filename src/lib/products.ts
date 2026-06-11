import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { products as demoProducts, type Product } from "@/data/products";

export type ProductInput = {
  ownerId?: string;
  storeId?: string;
  title: string;
  description: string;
  image: string;
  price: string | null;
  originalUrl: string;
  affiliateUrl: string;
  store: string;
  category?: string;
};

function productFromDoc(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    ownerId: typeof data.ownerId === "string" ? data.ownerId : undefined,
    storeId: typeof data.storeId === "string" ? data.storeId : undefined,
    title: String(data.title || "Producto sin título"),
    slug: String(data.slug || id),
    description: String(data.description || ""),
    price: typeof data.price === "number" ? data.price : 0,
    currency: String(data.currency || "USD"),
    imageUrl: String(data.imageUrl || ""),
    category: String(data.category || "Sin categoría"),
    store: String(data.store || "Tienda externa"),
    originalUrl: String(data.originalUrl || ""),
    affiliateUrl: String(data.affiliateUrl || data.originalUrl || ""),
    clicks: typeof data.clicks === "number" ? data.clicks : 0
  };
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `producto-${Date.now()}`;
}

export function parsePrice(value: string | null) {
  if (!value) return 0;

  const normalized = value
    .replace(/[^\d.,]/g, "")
    .replace(/,(?=\d{1,2}$)/, ".")
    .replace(/,/g, "");

  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) ? price : 0;
}

export async function getPublishedProducts() {
  if (!db) return demoProducts;

  const snapshot = await getDocs(query(collection(db, "products"), where("status", "==", "published")));
  const products = snapshot.docs.map((item) => productFromDoc(item.id, item.data()));

  return products.length ? products : demoProducts;
}

export async function getProductsByOwner(ownerId: string) {
  if (!db) return [];

  const snapshot = await getDocs(query(collection(db, "products"), where("ownerId", "==", ownerId)));
  return snapshot.docs.map((item) => productFromDoc(item.id, item.data()));
}

export async function getPublishedProductsByOwner(ownerId: string) {
  if (!db) return [];

  const snapshot = await getDocs(
    query(collection(db, "products"), where("ownerId", "==", ownerId), where("status", "==", "published"))
  );

  return snapshot.docs.map((item) => productFromDoc(item.id, item.data()));
}

export async function getProductBySlugFromStore(slug: string) {
  if (!db) return demoProducts.find((product) => product.slug === slug) || null;

  const snapshot = await getDocs(query(collection(db, "products"), where("slug", "==", slug)));
  const product = snapshot.docs[0];

  return product ? productFromDoc(product.id, product.data()) : null;
}

export async function getProductByOwnerAndSlug(ownerId: string, slug: string) {
  if (!db) return null;

  const snapshot = await getDocs(
    query(collection(db, "products"), where("ownerId", "==", ownerId), where("slug", "==", slug))
  );
  const product = snapshot.docs[0];

  return product ? productFromDoc(product.id, product.data()) : null;
}

export async function getProductByIdFromStore(id: string) {
  if (!db) return demoProducts.find((product) => product.id === id) || null;

  const snapshot = await getDoc(doc(db, "products", id));
  return snapshot.exists() ? productFromDoc(snapshot.id, snapshot.data()) : null;
}

export async function createProduct(input: ProductInput) {
  if (!db) throw new Error("Firebase no está configurado");

  const baseSlug = slugify(input.title);
  const existing = await getDocs(query(collection(db, "products"), where("slug", "==", baseSlug)));
  const slug = existing.empty ? baseSlug : `${baseSlug}-${Date.now().toString(36)}`;

  const docRef = await addDoc(collection(db, "products"), {
    ownerId: input.ownerId || null,
    storeId: input.storeId || null,
    title: input.title,
    slug,
    description: input.description,
    price: parsePrice(input.price),
    currency: "USD",
    imageUrl: input.image,
    originalUrl: input.originalUrl,
    affiliateUrl: input.affiliateUrl,
    store: input.store,
    category: input.category || "Sin categoría",
    status: "published",
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  const product = await getProductByIdFromStore(docRef.id);
  if (!product) throw new Error("El producto se guardó, pero no se pudo leer");

  return product;
}

export async function registerProductClick(productId: string, request: Request) {
  if (!db) return;

  const product = await getProductByIdFromStore(productId);
  if (!product) return;

  await addDoc(collection(db, "clicks"), {
    productId,
    ownerId: product.ownerId || null,
    storeId: product.storeId || null,
    userAgent: request.headers.get("user-agent") || "",
    referrer: request.headers.get("referer") || "",
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, "products", productId), {
    clicks: increment(1),
    updatedAt: serverTimestamp()
  });
}
