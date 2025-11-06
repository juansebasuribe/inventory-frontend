# 📚 ARQUITECTURA DE INVENTARIO - GUÍA COMPLETA

## 🎯 PROBLEMA IDENTIFICADO

**❌ ERROR ACTUAL:**
El frontend está intentando guardar `minimum_stock` y `maximum_stock` en el modelo **Product**, pero estos campos **NO EXISTEN** en el modelo Product del backend.

**✅ SOLUCIÓN:**
Los campos `min_quantity` y `max_quantity` pertenecen al modelo **InventoryItem** y se configuran **por ubicación física** (Location).

---

## 🏗️ ARQUITECTURA CORRECTA DEL BACKEND

### 1️⃣ **MODELO PRODUCT** (Catálogo de Productos)

```python
# apps/product/models.py
class Product:
    name: str                    # Nombre del producto
    description: str             # Descripción
    bar_code: str                # Código de barras (único)
    retail_price: Decimal        # Precio de venta
    cost_price: Decimal          # Precio de costo
    category: FK(Category)       # Categoría
    main_image: ImageField       # Imagen principal

    # ❌ NO TIENE: minimum_stock, maximum_stock
    # ✅ TIENE: total_stock (calculado de InventoryItems)
    # ✅ TIENE: stock_by_location (dict calculado)
```

**Endpoint:** `/api/product/v1/products/simple/`

**Campos que devuelve relacionados con stock:**

- `total_stock`: Suma de todos los InventoryItems del producto
- `stock_by_location`: Dict con stock por ubicación (incluye min/max calculados)
- `in_stock`: Boolean (total_stock > 0)
- `needs_restock`: Boolean (calculado comparando con min_quantity de InventoryItems)

---

### 2️⃣ **MODELO LOCATION** (Ubicación Principal)

```python
# apps/warehouse/models.py
class Location:
    name: str                    # Ej: "Almacén Principal"
    code: str                    # Ej: "ALM001" (único)
    type: LocationType           # warehouse, storage, store, showroom
    address: str                 # Dirección física
    capacity: int                # Capacidad total
    is_active: bool
```

**Tipos de ubicación:**

- `warehouse`: Almacén
- `storage`: Bodega
- `store`: Tienda
- `showroom`: Sala de Exhibición

**Endpoint:** `/api/warehouse/v1/locations/`

---

### 3️⃣ **MODELO INVENTORYITEM** (Stock por Ubicación) ⭐

```python
# apps/inventory/models.py
class InventoryItem:
    # Relaciones
    product: FK(Product)         # ¿Qué producto?
    location: FK(Location)       # ¿Dónde está? (ubicación principal)

    # Ubicación física detallada (OPCIONAL)
    aisle: str                   # Pasillo (Ej: "A1", "B2")
    shelf: str                   # Estante (Ej: "E1", "E2")
    bin: str                     # Contenedor (Ej: "C1", "C2")

    # Stock y límites ⚠️ AQUÍ ESTÁN MIN/MAX
    quantity: int                # Cantidad actual
    min_quantity: int            # ✅ Stock mínimo (POR UBICACIÓN)
    max_quantity: int            # ✅ Stock máximo (POR UBICACIÓN)

    # Campos calculados
    needs_restock: bool          # quantity <= min_quantity
    overstock: bool              # quantity >= max_quantity
    last_restocked: datetime
```

**Endpoint:** `/api/inventory/v1/items/`

---

## 🎯 JERARQUÍA DE UBICACIÓN FÍSICA

```
🏢 LOCATION (Ubicación Principal) - Ej: Almacén Norte
    └── 🛤️ AISLE (Pasillo) - Ej: A1, A2, B1, B2
        └── 📚 SHELF (Estante) - Ej: E1, E2, E3, E4
            └── 📦 BIN (Contenedor) - Ej: C1, C2, C3
                └── 📱 PRODUCTO (con cantidad y límites)
```

**Ejemplo real:**

```
📍 Almacén Principal (ALM001)
   └── Pasillo A1
       └── Estante E2
           └── Contenedor C3
               └── iPhone 13 Pro (50 unidades)
                   ├── min_quantity: 10
                   └── max_quantity: 100
```

---

## 📊 RESPUESTA DEL BACKEND - Product con Stock

Cuando el backend devuelve un Product, incluye información de inventario:

```json
{
  "id": 1,
  "name": "iPhone 13 Pro",
  "bar_code": "123456789",
  "retail_price": 1200.0,
  "total_stock": 150,
  "in_stock": true,
  "needs_restock": false,
  "stock_by_location": {
    "ALM001": {
      "location_name": "Almacén Principal",
      "quantity": 100,
      "min_quantity": 20,
      "max_quantity": 200,
      "aisle": "A1",
      "shelf": "E2",
      "bin": "C3"
    },
    "STORE01": {
      "location_name": "Tienda Centro",
      "quantity": 50,
      "min_quantity": 10,
      "max_quantity": 80,
      "aisle": "P1",
      "shelf": "S1",
      "bin": null
    }
  }
}
```

**Observa que:**

- `total_stock = 150` (suma de todas las ubicaciones: 100 + 50)
- `min_quantity` y `max_quantity` son **por ubicación**, NO globales del producto

---

## 🔧 FLUJO CORRECTO EN EL FRONTEND

### ✅ CREAR UN PRODUCTO (Paso 1)

```typescript
// Endpoint: POST /api/product/v1/products/simple/
const productData = {
  name: "iPhone 13 Pro",
  bar_code: "123456789",
  retail_price: 1200.0,
  cost_price: 1000.0,
  category: 5,
  description: "Smartphone de última generación",
  // ❌ NO ENVIAR: minimum_stock, maximum_stock
};

const newProduct = await productService.createProduct(productData);
```

### ✅ AGREGAR PRODUCTO AL INVENTARIO (Paso 2)

```typescript
// Endpoint: POST /api/inventory/v1/items/
const inventoryData = {
  product: newProduct.id, // ID del producto creado
  location: 1, // ID de la ubicación (Location)
  aisle: "A1", // Pasillo (opcional)
  shelf: "E2", // Estante (opcional)
  bin: "C3", // Contenedor (opcional)
  quantity: 100, // Cantidad inicial
  min_quantity: 20, // ✅ Stock mínimo
  max_quantity: 200, // ✅ Stock máximo
};

const inventoryItem = await inventoryService.createInventoryItem(inventoryData);
```

### ✅ REGISTRAR MOVIMIENTO DE INVENTARIO (Entrada/Salida)

```typescript
// Endpoint: POST /api/inventory/v1/movements/
const movementData = {
  movement_type: "entry", // entry, exit, transfer, adjustment
  product_barcode: "123456789", // Código de barras del producto
  quantity: 50, // Cantidad del movimiento
  to_location_code: "ALM001", // A dónde va (para entry/transfer)
  from_location_code: "STORE01", // De dónde viene (para exit/transfer)
  reference_number: "PO-2024-001", // Número de referencia
  notes: "Reabastecimiento mensual",
  aisle: "A1", // Ubicación física específica
  shelf: "E2",
  bin: "C3",
};

const movement = await inventoryService.createMovement(movementData);
```

---

## 🛠️ CORRECCIONES NECESARIAS EN EL FRONTEND

### 1️⃣ **ProductCreate / ProductUpdate Types**

```typescript
// ❌ ANTES (INCORRECTO)
export interface ProductCreate {
  name: string;
  bar_code: string;
  retail_price: number;
  cost_price: number;
  category: number;
  minimum_stock?: number; // ❌ NO EXISTE EN BACKEND
  maximum_stock?: number; // ❌ NO EXISTE EN BACKEND
}

// ✅ DESPUÉS (CORRECTO)
export interface ProductCreate {
  name: string;
  bar_code: string;
  retail_price: number;
  cost_price: number;
  category: number;
  description?: string;
  main_image?: File;
  // ❌ SIN minimum_stock / maximum_stock
}
```

### 2️⃣ **ProductCreateModal / ProductEditModal**

```tsx
// ❌ REMOVER estos campos del formulario:
<Input
  label="Stock Mínimo"
  name="minimum_stock"
  type="number"
/>
<Input
  label="Stock Máximo"
  name="maximum_stock"
  type="number"
/>

// ✅ Estos campos deben estar en InventoryItemForm
```

### 3️⃣ **productService.ts**

```typescript
// ❌ REMOVER estos aliases:
formData.append("minimum_stock", v);
formData.append("min_quantity", v); // ❌ Solo para InventoryItem
formData.append("min_stock", v);

formData.append("maximum_stock", v);
formData.append("max_quantity", v); // ❌ Solo para InventoryItem
formData.append("max_stock", v);

// ✅ NO enviar estos campos a /api/product/v1/products/simple/
```

### 4️⃣ **AdminProductsPage - Mostrar Stock Correctamente**

```tsx
// ✅ Mostrar total_stock (suma de todas las ubicaciones)
<td>{product.total_stock || 0}</td>;

// ✅ Mostrar stock_by_location en un popover o tabla expandible
{
  product.stock_by_location && (
    <StockByLocationTable data={product.stock_by_location} />
  );
}

// ❌ NO mostrar minimum_stock / maximum_stock globales
```

---

## 📦 COMPONENTES A CREAR

### ✅ **InventoryItemForm.tsx**

Formulario para agregar productos a ubicaciones específicas:

```tsx
<Form>
  <Select label="Producto" name="product" />
  <Select label="Ubicación" name="location" />
  <Input label="Pasillo" name="aisle" placeholder="Ej: A1" />
  <Input label="Estante" name="shelf" placeholder="Ej: E2" />
  <Input label="Contenedor" name="bin" placeholder="Ej: C3" />
  <Input label="Cantidad" name="quantity" type="number" required />
  <Input label="Stock Mínimo" name="min_quantity" type="number" required />
  <Input label="Stock Máximo" name="max_quantity" type="number" required />
</Form>
```

### ✅ **StockByLocationTable.tsx**

Tabla para mostrar stock por ubicación:

```tsx
<Table>
  <thead>
    <tr>
      <th>Ubicación</th>
      <th>Pasillo</th>
      <th>Estante</th>
      <th>Bin</th>
      <th>Cantidad</th>
      <th>Min</th>
      <th>Max</th>
      <th>Estado</th>
    </tr>
  </thead>
  <tbody>
    {Object.entries(stock_by_location).map(([code, data]) => (
      <tr key={code}>
        <td>{data.location_name}</td>
        <td>{data.aisle || "-"}</td>
        <td>{data.shelf || "-"}</td>
        <td>{data.bin || "-"}</td>
        <td>{data.quantity}</td>
        <td>{data.min_quantity}</td>
        <td>{data.max_quantity}</td>
        <td>
          <StockStatusBadge
            quantity={data.quantity}
            min={data.min_quantity}
            max={data.max_quantity}
          />
        </td>
      </tr>
    ))}
  </tbody>
</Table>
```

---

## 🎨 NOMENCLATURA RECOMENDADA

### Pasillos (Aisle)

- Formato: Letra + Número
- Ejemplos: A1, A2, B1, B2, C1, C2

### Estantes (Shelf)

- Formato: E + Número
- Ejemplos: E1, E2, E3, E4, E5

### Contenedores (Bin)

- Formato: C + Número
- Ejemplos: C1, C2, C3, C4

### Códigos de Ubicación

- Formato: Prefijo + Número
- Ejemplos: ALM001, STORE01, BOD002

---

## 📋 ENDPOINTS DISPONIBLES

### PRODUCTOS

```
GET    /api/product/v1/products/simple/                  # Listar productos
POST   /api/product/v1/products/simple/                  # Crear producto
GET    /api/product/v1/products/code/simple/{barcode}/   # Detalle por código
PUT    /api/product/v1/products/code/simple/{barcode}/   # Actualizar
```

### INVENTARIO

```
GET    /api/inventory/v1/items/                          # Listar items
POST   /api/inventory/v1/items/                          # Crear item
GET    /api/inventory/v1/items/{id}/                     # Detalle
PUT    /api/inventory/v1/items/{id}/                     # Actualizar
PUT    /api/inventory/v1/items/{id}/update-quantity/     # Actualizar solo cantidad
GET    /api/inventory/v1/items/low-stock/                # Items con stock bajo
GET    /api/inventory/v1/items/overstock/                # Items con sobrestock
```

### MOVIMIENTOS

```
GET    /api/inventory/v1/movements/                      # Listar movimientos
POST   /api/inventory/v1/movements/                      # Crear movimiento
GET    /api/inventory/v1/movements/{code}/               # Detalle
GET    /api/inventory/v1/movements/by-product/{code}/    # Por producto
GET    /api/inventory/v1/movements/by-location/{code}/   # Por ubicación
```

### UBICACIONES

```
GET    /api/warehouse/v1/locations/                      # Listar ubicaciones
POST   /api/warehouse/v1/locations/                      # Crear ubicación
GET    /api/warehouse/v1/locations/{id}/                 # Detalle
PUT    /api/warehouse/v1/locations/{id}/                 # Actualizar
GET    /api/warehouse/v1/locations/{id}/inventory/       # Inventario de ubicación
GET    /api/warehouse/v1/locations/{id}/inventory/alerts/ # Alertas de ubicación
```

### ALERTAS

```
GET    /api/inventory/v1/alerts/                         # Listar alertas
GET    /api/inventory/v1/alerts/unresolved/              # Alertas sin resolver
POST   /api/inventory/v1/alerts/{id}/resolve/            # Resolver alerta
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Al crear un producto:

- [ ] ❌ NO enviar `minimum_stock` o `maximum_stock` al endpoint de productos
- [ ] ✅ Solo enviar: name, bar_code, retail_price, cost_price, category, description, main_image

### Al agregar producto al inventario:

- [ ] ✅ Seleccionar Location (ubicación principal)
- [ ] ✅ Opcionalmente especificar: aisle, shelf, bin
- [ ] ✅ Definir quantity, min_quantity, max_quantity
- [ ] ✅ Enviar todo a `/api/inventory/v1/items/`

### Al mostrar productos:

- [ ] ✅ Mostrar `total_stock` (suma de todas las ubicaciones)
- [ ] ✅ Mostrar `stock_by_location` (detalle por ubicación con min/max)
- [ ] ❌ NO mostrar `minimum_stock` o `maximum_stock` globales

### Al registrar movimientos:

- [ ] ✅ Usar movement_type correcto (entry, exit, transfer, adjustment)
- [ ] ✅ Especificar product_barcode
- [ ] ✅ Especificar ubicación (to_location_code o from_location_code)
- [ ] ✅ Opcionalmente incluir aisle, shelf, bin para ubicación precisa

---

## 🚀 PRÓXIMOS PASOS

1. **Remover campos min/max de ProductCreate/ProductUpdate**
2. **Limpiar productService.ts** - eliminar aliases innecesarios
3. **Actualizar ProductCreateModal** - remover campos de stock
4. **Actualizar ProductEditModal** - remover campos de stock
5. **Crear InventoryItemForm** - formulario correcto para inventario
6. **Mejorar AdminProductsPage** - mostrar stock_by_location correctamente
7. **Verificar AdminInventoryPage** - asegurar uso correcto de jerarquía Location → Aisle → Shelf → Bin

---

**Fecha de creación:** 5 de noviembre de 2025  
**Autor:** Sistema de Gestión de Inventario TiTa  
**Versión:** 1.0
