import { getTursoClient, initTursoDatabase } from '../lib/turso';
import type { CartItem, PlacedOrder } from '../app/components/CheckoutDrawer';

// Fallback in-memory store for orders if Turso is unreachable or offline
const memoryOrders: PlacedOrder[] = [];

export async function saveOrder(order: PlacedOrder): Promise<boolean> {
  // Always update in-memory fallback
  const idx = memoryOrders.findIndex((o) => o.orderNumber === order.orderNumber);
  if (idx >= 0) {
    memoryOrders[idx] = order;
  } else {
    memoryOrders.unshift(order);
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();

    await client.execute({
      sql: `INSERT OR REPLACE INTO orders (
        id, customer_name, customer_phone, delivery_address, delivery_sector,
        delivery_notes, delivery_slot, payment_method, cash_change_for,
        subtotal, discount, shipping, grand_total, status, items_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        order.orderNumber,
        'Cliente Supermercado Osos',
        '',
        order.address,
        'Santa Rosa de Osos',
        order.notes,
        order.slot,
        order.paymentMethod,
        null,
        order.subtotal,
        order.discount,
        order.shipping,
        order.total,
        'recibido',
        JSON.stringify(order.items),
      ],
    });

    return true;
  } catch (error) {
    console.warn('Turso saveOrder offline fallback to local state:', error);
    return true;
  }
}

export async function getOrderById(id: string): Promise<PlacedOrder | null> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const result = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [id],
    });

    if (result.rows.length > 0) {
      const row = result.rows[0];
      let items: CartItem[] = [];
      try {
        items = JSON.parse(String(row.items_json ?? '[]')) as CartItem[];
      } catch {
        items = [];
      }

      return {
        orderNumber: String(row.id),
        items,
        subtotal: Number(row.subtotal ?? 0),
        discount: Number(row.discount ?? 0),
        shipping: Number(row.shipping ?? 0),
        total: Number(row.grand_total ?? 0),
        address: String(row.delivery_address ?? ''),
        notes: String(row.delivery_notes ?? ''),
        slot: String(row.delivery_slot ?? ''),
        paymentMethod: String(row.payment_method ?? ''),
        estimatedMinutes: String(row.delivery_slot ?? '').includes('Express') ? '25-35 min' : 'Según programación',
      };
    }
  } catch (error) {
    console.warn('Turso getOrderById fallback to local store:', error);
  }

  return memoryOrders.find((o) => o.orderNumber === id) ?? null;
}

export async function getAllOrders(): Promise<PlacedOrder[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const result = await client.execute('SELECT * FROM orders ORDER BY created_at DESC');

    if (result.rows.length > 0) {
      return result.rows.map((row) => {
        let items: CartItem[] = [];
        try {
          items = JSON.parse(String(row.items_json ?? '[]')) as CartItem[];
        } catch {
          items = [];
        }

        return {
          orderNumber: String(row.id),
          items,
          subtotal: Number(row.subtotal ?? 0),
          discount: Number(row.discount ?? 0),
          shipping: Number(row.shipping ?? 0),
          total: Number(row.grand_total ?? 0),
          address: String(row.delivery_address ?? ''),
          notes: String(row.delivery_notes ?? ''),
          slot: String(row.delivery_slot ?? ''),
          paymentMethod: String(row.payment_method ?? ''),
          estimatedMinutes: String(row.delivery_slot ?? '').includes('Express') ? '25-35 min' : 'Programado',
        };
      });
    }
  } catch (error) {
    console.warn('Turso getAllOrders fallback to local store:', error);
  }

  return [...memoryOrders];
}
