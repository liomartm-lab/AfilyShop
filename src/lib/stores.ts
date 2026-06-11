import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore/lite";
import { db } from "@/lib/firebase";
import { slugify } from "@/lib/products";

export type StoreTheme = {
  primaryColor: string;
  accentColor: string;
};

export type StoreProfile = {
  id: string;
  ownerId: string;
  username: string;
  name: string;
  logoUrl: string;
  description: string;
  theme: StoreTheme;
  plan: "free" | "pro" | "business";
  status: "active" | "paused";
};

export type StoreInput = {
  name: string;
  username: string;
  logoUrl: string;
  description: string;
  theme: StoreTheme;
};

const reservedUsernames = new Set([
  "admin",
  "api",
  "dashboard",
  "go",
  "login",
  "product",
  "products",
  "settings"
]);

function storeFromDoc(id: string, data: Record<string, unknown>): StoreProfile {
  const theme = data.theme && typeof data.theme === "object" ? data.theme as Record<string, unknown> : {};

  return {
    id,
    ownerId: String(data.ownerId || id),
    username: String(data.username || id),
    name: String(data.name || "Mi tienda"),
    logoUrl: String(data.logoUrl || ""),
    description: String(data.description || "Catálogo de productos recomendados."),
    theme: {
      primaryColor: String(theme.primaryColor || "#2563eb"),
      accentColor: String(theme.accentColor || "#10b981")
    },
    plan: data.plan === "pro" || data.plan === "business" ? data.plan : "free",
    status: data.status === "paused" ? "paused" : "active"
  };
}

export function normalizeUsername(value: string) {
  return slugify(value).replace(/-/g, "").slice(0, 28);
}

export function isReservedUsername(username: string) {
  return reservedUsernames.has(username);
}

export async function getStoreByOwnerId(ownerId: string) {
  if (!db) return null;

  const snapshot = await getDoc(doc(db, "stores", ownerId));
  return snapshot.exists() ? storeFromDoc(snapshot.id, snapshot.data()) : null;
}

export async function getStoreByUsername(username: string) {
  if (!db) return null;

  const normalized = normalizeUsername(username);
  const snapshot = await getDocs(query(collection(db, "stores"), where("username", "==", normalized)));
  const store = snapshot.docs[0];

  return store ? storeFromDoc(store.id, store.data()) : null;
}

export async function usernameIsAvailable(username: string, ownerId?: string) {
  if (!db) return false;

  const normalized = normalizeUsername(username);
  if (!normalized || isReservedUsername(normalized)) return false;

  const snapshot = await getDocs(query(collection(db, "stores"), where("username", "==", normalized)));
  return snapshot.empty || snapshot.docs.every((item) => item.id === ownerId);
}

export async function createDefaultStore(ownerId: string, email: string, requestedUsername?: string) {
  if (!db) throw new Error("Firebase no está configurado");

  const emailName = email.split("@")[0] || "tienda";
  const baseUsername = normalizeUsername(requestedUsername || emailName);
  const username = await usernameIsAvailable(baseUsername)
    ? baseUsername
    : `${baseUsername}${Date.now().toString().slice(-4)}`;

  const store = {
    ownerId,
    username,
    name: `Tienda de ${emailName}`,
    logoUrl: "",
    description: "Catálogo de productos recomendados.",
    theme: {
      primaryColor: "#2563eb",
      accentColor: "#10b981"
    },
    plan: "free",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "stores", ownerId), store);
  await setDoc(doc(db, "users", ownerId), {
    email,
    storeId: ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return getStoreByOwnerId(ownerId);
}

export async function updateStore(ownerId: string, input: StoreInput) {
  if (!db) throw new Error("Firebase no está configurado");

  const username = normalizeUsername(input.username);
  const available = await usernameIsAvailable(username, ownerId);
  if (!available) throw new Error("Ese usuario público no está disponible");

  await updateDoc(doc(db, "stores", ownerId), {
    name: input.name,
    username,
    logoUrl: input.logoUrl,
    description: input.description,
    theme: input.theme,
    updatedAt: serverTimestamp()
  });

  return getStoreByOwnerId(ownerId);
}
