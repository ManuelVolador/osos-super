import { createClient, type Client } from '@libsql/client/web';
import { PRODUCTS } from '../app/data/products';
import { NOTICES } from '../app/data/notices';

const rawUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_DATABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_TURSO_DATABASE_URL) ||
  'libsql://osos-manuelvolador.aws-us-east-2.turso.io';

const authToken =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_AUTH_TOKEN) ||
  (typeof process !== 'undefined' && process.env?.VITE_TURSO_AUTH_TOKEN) ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkwODQzMDMsImlkIjoiMDFhMDhkYjktYzkwMS03MmI3LWIwYmEtNDA1YmU1NWNlZTIzIiwia2lkIjoiS29jRjlxTnA2MUYweXpFNjRxV21naFJHbkVfRXdIVFlhVm4yVWNjQnpGQSIsInJpZCI6IjhhZmVkNDYxLWExN2UtNDljZi05NjBhLTU4MTFkN2JmYjhhYSJ9.2kKIP1f0GWaNjXPdQ65EGVp3XAvmBPdn9WaIfaRG0dbyjguXNL_J-kd3GVHQJw4AApiP4Z7fMjb4NPEGEk_WBg';

// Convert libsql:// to https:// for browser fetch compatibility
const httpUrl = rawUrl.replace(/^libsql:\/\//, 'https://');

export const tursoClient: Client = createClient({
  url: httpUrl,
  authToken,
});

export function getTursoClient(): Client {
  return tursoClient;
}

let initDbPromise: Promise<void> | null = null;

export async function initTursoDatabase(): Promise<void> {
  if (initDbPromise) {
    return initDbPromise;
  }

  initDbPromise = (async () => {
    try {
      // 1. Orders table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_name TEXT,
          customer_phone TEXT,
          delivery_address TEXT,
          delivery_sector TEXT,
          delivery_notes TEXT,
          delivery_slot TEXT,
          payment_method TEXT,
          cash_change_for REAL,
          subtotal REAL,
          discount REAL,
          shipping REAL,
          grand_total REAL,
          status TEXT DEFAULT 'recibido',
          items_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Products table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          category_label TEXT,
          price REAL,
          original_price REAL,
          unit TEXT,
          badge TEXT,
          badge_type TEXT,
          image TEXT,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Job Applications table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS job_applications (
          id TEXT PRIMARY KEY,
          full_name TEXT,
          phone TEXT,
          email TEXT,
          position TEXT,
          message TEXT,
          cv_filename TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Subscribers table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS subscribers (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. Contact Messages table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS contact_messages (
          id TEXT PRIMARY KEY,
          name TEXT,
          email TEXT,
          phone TEXT,
          message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 6. Notices table
      await tursoClient.execute(`
        CREATE TABLE IF NOT EXISTS notices (
          id TEXT PRIMARY KEY,
          title TEXT,
          excerpt TEXT,
          content TEXT,
          category TEXT,
          date TEXT,
          read_time TEXT,
          author TEXT,
          tag_color TEXT,
          is_featured INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed products if empty
      try {
        const prodCountRes = await tursoClient.execute('SELECT COUNT(*) as count FROM products');
        const count = Number(prodCountRes.rows[0]?.count ?? 0);
        if (count === 0 && PRODUCTS.length > 0) {
          const productStatements = PRODUCTS.map((p) => ({
            sql: `INSERT OR IGNORE INTO products (id, name, category, category_label, price, original_price, unit, badge, badge_type, image, description, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            args: [
              p.id,
              p.name,
              p.category,
              p.categoryLabel,
              p.price,
              p.originalPrice ?? null,
              p.unit,
              p.badge ?? null,
              p.badgeType ?? null,
              p.image,
              p.description,
            ],
          }));
          await tursoClient.batch(productStatements, 'write');
        }
      } catch (err) {
        console.warn('Turso seeding products notice:', err);
      }

      // Seed notices if empty
      try {
        const noticeCountRes = await tursoClient.execute('SELECT COUNT(*) as count FROM notices');
        const count = Number(noticeCountRes.rows[0]?.count ?? 0);
        if (count === 0 && NOTICES.length > 0) {
          const noticeStatements = NOTICES.map((n, idx) => ({
            sql: `INSERT OR IGNORE INTO notices (id, title, excerpt, content, category, date, read_time, author, tag_color, is_featured)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              n.id,
              n.title,
              n.summary,
              JSON.stringify(n.content),
              n.category,
              n.date,
              n.readTime,
              n.author,
              n.tagColor,
              idx === 0 ? 1 : 0,
            ],
          }));
          await tursoClient.batch(noticeStatements, 'write');
        }
      } catch (err) {
        console.warn('Turso seeding notices notice:', err);
      }
    } catch (error) {
      console.warn('Turso database initialization deferred / offline mode active:', error);
    }
  })();

  return initDbPromise;
}
