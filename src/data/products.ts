export type Product = {
  id: string;
  ownerId?: string;
  storeId?: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  images?: string[];
  stock?: string;
  deliveryTime?: string;
  category: string;
  store: string;
  originalUrl: string;
  affiliateUrl: string;
  clicks: number;
};

export const products: Product[] = [
  {
    id: "p_eco_001",
    title: "EcoFlow River 3 Max Plus",
    slug: "ecoflow-river-3-max-plus",
    description: "Estación de energía portátil ideal para emergencias, camping, apagones y respaldo en casa.",
    price: 399.99,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1200&auto=format&fit=crop",
    category: "Energía portátil",
    store: "Tienda externa",
    originalUrl: "https://example.com/product/ecoflow-river-3-max-plus",
    affiliateUrl: "https://example.com/product/ecoflow-river-3-max-plus?ref=TU-CODIGO",
    clicks: 128
  },
  {
    id: "p_tv_002",
    title: "Samsung Smart TV 65” Crystal UHD 4K",
    slug: "samsung-smart-tv-65-crystal-uhd-4k",
    description: "Televisor UHD 4K con funciones inteligentes, ideal para streaming, deportes y entretenimiento familiar.",
    price: 489,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1200&auto=format&fit=crop",
    category: "Televisores",
    store: "Tienda externa",
    originalUrl: "https://example.com/product/samsung-tv-65",
    affiliateUrl: "https://example.com/product/samsung-tv-65?ref=TU-CODIGO",
    clicks: 94
  },
  {
    id: "p_lap_003",
    title: "Laptop Pro 15.6” para trabajo y estudio",
    slug: "laptop-pro-156-trabajo-estudio",
    description: "Laptop moderna para oficina, estudio, navegación, reuniones y tareas diarias.",
    price: 529.99,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    category: "Computadoras",
    store: "Tienda externa",
    originalUrl: "https://example.com/product/laptop-pro",
    affiliateUrl: "https://example.com/product/laptop-pro?aff=TU-CODIGO",
    clicks: 61
  }
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}
