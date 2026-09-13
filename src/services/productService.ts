import { getTursoClient, initTursoDatabase } from '../lib/turso';
import { type Product, type ProductCategory, PRODUCTS } from '../app/data/products';

const LOCAL_PRODUCTS_KEY = 'osos_custom_products';
const LOCAL_DELETED_KEY = 'osos_deleted_products';

function getLocalCustomProducts(): Product[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalDeletedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const deletedIds = getLocalDeletedIds();
  const customProducts = getLocalCustomProducts();

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, name ASC');

    if (res.rows.length > 0) {
      const tursoProducts: Product[] = res.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        category: String(row.category) as ProductCategory,
        categoryLabel: String(row.category_label),
        price: Number(row.price),
        originalPrice: row.original_price != null ? Number(row.original_price) : undefined,
        unit: String(row.unit),
        badge: row.badge ? String(row.badge) : undefined,
        badgeType: row.badge_type ? (String(row.badge_type) as Product['badgeType']) : undefined,
        image: String(row.image),
        description: String(row.description),
      }));

      // Merge custom local products with Turso
      const map = new Map<string, Product>();
      tursoProducts.forEach((p) => {
        if (!deletedIds.has(p.id)) map.set(p.id, p);
      });
      customProducts.forEach((p) => {
        if (!deletedIds.has(p.id)) map.set(p.id, p);
      });

      return Array.from(map.values());
    }
  } catch (error) {
    console.warn('Turso fetchProducts offline fallback to static products:', error);
  }

  // Fallback
  const map = new Map<string, Product>();
  PRODUCTS.forEach((p) => {
    if (!deletedIds.has(p.id)) map.set(p.id, p);
  });
  customProducts.forEach((p) => {
    if (!deletedIds.has(p.id)) map.set(p.id, p);
  });

  return Array.from(map.values());
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  const allProducts = await fetchProducts();

  if (!category || category === 'todos') {
    return allProducts;
  }

  if (category === 'ofertas') {
    return allProducts.filter(
      (p) => (p.originalPrice !== undefined && p.originalPrice > p.price) || p.badgeType === 'discount'
    );
  }

  return allProducts.filter((p) => p.category === category);
}

export async function saveProduct(product: Product): Promise<Product> {
  const custom = getLocalCustomProducts().filter((p) => p.id !== product.id);
  custom.unshift(product);
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(custom));
    const deleted = getLocalDeletedIds();
    if (deleted.has(product.id)) {
      deleted.delete(product.id);
      localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(deleted)));
    }
  } catch {
    // Ignore storage issues
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: `INSERT OR REPLACE INTO products (
        id, name, category, category_label, price, original_price, unit, badge, badge_type, image, description, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        product.id,
        product.name,
        product.category,
        product.categoryLabel || product.category,
        product.price,
        product.originalPrice ?? null,
        product.unit,
        product.badge ?? null,
        product.badgeType ?? null,
        product.image,
        product.description,
      ],
    });
  } catch (error) {
    console.warn('Turso saveProduct offline fallback:', error);
  }

  return product;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const custom = getLocalCustomProducts().filter((p) => p.id !== productId);
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(custom));
    const deleted = getLocalDeletedIds();
    deleted.add(productId);
    localStorage.setItem(LOCAL_DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch {
    // Ignore storage issues
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: 'UPDATE products SET is_active = 0 WHERE id = ?',
      args: [productId],
    });
  } catch (error) {
    console.warn('Turso deleteProduct offline fallback:', error);
  }

  return true;
}
