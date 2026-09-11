import { getTursoClient, initTursoDatabase } from '../lib/turso';
import { type Product, type ProductCategory, PRODUCTS } from '../app/data/products';

export async function fetchProducts(): Promise<Product[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM products WHERE is_active = 1 ORDER BY category ASC, name ASC');

    if (res.rows.length > 0) {
      return res.rows.map((row) => ({
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
    }
  } catch (error) {
    console.warn('Turso fetchProducts offline fallback to static products:', error);
  }

  return [...PRODUCTS];
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
