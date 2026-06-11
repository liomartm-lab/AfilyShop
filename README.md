# AfiliShop Starter con Firebase

Proyecto inicial para una tienda afiliada automática.

La idea del sistema es:

1. Tú pegas un enlace de producto en el panel admin.
2. El sistema intenta leer título, imagen, descripción y precio.
3. Se genera un enlace afiliado con tu código.
4. El producto se muestra en la tienda.
5. Cuando el usuario presiona comprar, pasa por `/go/[id]` para registrar el clic en Firestore y luego sale a la tienda externa.

---

## Qué trae esta carpeta

- Página pública de tienda.
- Tarjetas de productos demo como respaldo.
- Página individual de producto.
- Panel admin en `/admin`.
- Login y registro en `/login`.
- Dashboard de vendedor en `/dashboard`.
- Tienda pública por usuario en `/{username}`.
- API básica `/api/analyze` para analizar enlaces usando metadata/Open Graph.
- API `/api/products` para listar y publicar productos en Firestore.
- Ruta `/go/[id]` para redirección afiliada.
- Archivo `.env.example`.

---

## Cómo abrirlo en VS Code

1. Descomprime el ZIP.
2. Abre VS Code.
3. File > Open Folder.
4. Selecciona la carpeta `afili-shop-starter`.
5. Abre la terminal dentro de VS Code.

Ejecuta:

```bash
npm install
npm run dev
```

Abre en el navegador:

```text
http://localhost:3000
```

Panel admin:

```text
http://localhost:3000/admin
```

---

## Archivos importantes

```text
src/app/page.tsx                 Página principal
src/app/login/page.tsx           Login y registro
src/app/dashboard/page.tsx       Panel del vendedor
src/app/[username]/page.tsx      Tienda pública del vendedor
src/app/admin/page.tsx           Redirección al dashboard
src/app/api/analyze/route.ts     Endpoint que analiza links
src/app/api/products/route.ts    Endpoint que guarda y lista productos
src/app/product/[slug]/page.tsx  Página individual
src/app/go/[id]/route.ts         Redirección afiliada
src/data/products.ts             Productos demo
src/lib/affiliate.ts             Generador de enlaces afiliados
src/lib/firebase.ts              Configuración Firebase/Auth/Firestore
src/lib/stores.ts                Tiendas por usuario
src/lib/products.ts              Lectura, guardado y clics en Firestore
firebase/firestore.rules         Reglas iniciales de Firestore
```

---

## Próximos pasos recomendados

### Fase 1: Visual

- Cambiar nombre AfiliShop por el nombre real de tu proyecto.
- Cambiar colores.
- Agregar categorías reales.
- Ajustar tarjetas de productos.

### Fase 2: Firebase

- Crear proyecto en Firebase.
- Activar Firestore Database.
- Copiar las claves web en `.env.local`.
- Publicar productos desde `/admin`.

### Fase 3: Admin real

- Permitir editar título, precio, categoría e imagen antes de publicar.
- Crear login para admin con Firebase Auth.

### Fase 4: Scraping avanzado

- Mantener Open Graph como método principal.
- Crear reglas por tienda.
- Usar Playwright para páginas que cargan con JavaScript.
- Usar APIs oficiales cuando la tienda lo exija.

---

## Nota importante sobre scraping

No todas las tiendas permiten extraer datos automáticamente. Algunas bloquean bots o exigen usar su API oficial. Este starter está hecho para comenzar con metadata básica y luego mejorar tienda por tienda.

---

## Prompt recomendado para Codex

Cuando abras la carpeta en VS Code, puedes pedirle a Codex:

```text
Revisa este proyecto Next.js. Quiero convertirlo en una tienda afiliada real. Primero conecta el panel admin con Firebase/Firestore para guardar productos nuevos desde el resultado de /api/analyze. Mantén el diseño actual y explícame cada archivo que modifiques.
```
