import { getTursoClient, initTursoDatabase } from '../lib/turso';
import type { CartItem, PlacedOrder } from '../app/components/CheckoutDrawer';
export type { PlacedOrder } from '../app/components/CheckoutDrawer';
import { realtimeService } from './realtimeService';

// Fallback in-memory store for orders if Turso is unreachable or offline
const memoryOrders: PlacedOrder[] = [];
const deletedOrderIds = new Set<string>();

export async function saveOrder(order: PlacedOrder): Promise<boolean> {
  deletedOrderIds.delete(order.orderNumber);
  // Always update in-memory fallback
  const idx = memoryOrders.findIndex((o) => o.orderNumber === order.orderNumber);
  if (idx >= 0) {
    memoryOrders[idx] = order;
  } else {
    memoryOrders.unshift(order);
  }

  // Real-time broadcast for live WebSockets / cross-tab synchronization
  realtimeService.broadcastNewOrder(order);

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
        order.customerName || 'Cliente Supermercado Osos',
        order.customerPhone || '',
        order.address,
        'Santa Rosa de Osos',
        order.notes ?? null,
        order.slot ?? null,
        order.paymentMethod || 'contraentrega',
        null,
        order.subtotal ?? 0,
        order.discount ?? 0,
        order.shipping ?? 0,
        order.total ?? 0,
        order.status || 'recibido',
        JSON.stringify(order.items || []),
      ],
    });

    return true;
  } catch (error) {
    console.warn('Turso saveOrder offline fallback to local state:', error);
    return true;
  }
}

export async function getOrderById(id: string): Promise<PlacedOrder | null> {
  if (deletedOrderIds.has(id)) return null;

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

    const tursoOrders: PlacedOrder[] = result.rows.map((row) => {
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
        status: String(row.status ?? 'recibido'),
        createdAt: String(row.created_at ?? ''),
        customerName: String(row.customer_name ?? 'Cliente Osos'),
        customerPhone: String(row.customer_phone ?? ''),
      };
    });

    const combined: PlacedOrder[] = [...tursoOrders];
    for (const memOrder of memoryOrders) {
      const idx = combined.findIndex((o) => o.orderNumber === memOrder.orderNumber);
      if (idx === -1) {
        combined.unshift(memOrder);
      } else {
        combined[idx] = { ...combined[idx], ...memOrder };
      }
    }

    return combined.filter((o) => !deletedOrderIds.has(o.orderNumber));
  } catch (error) {
    console.warn('Turso getAllOrders fallback to local store:', error);
  }

  return memoryOrders.filter((o) => !deletedOrderIds.has(o.orderNumber));
}

export async function updateOrderStatus(orderNumber: string, status: string): Promise<boolean> {
  const localOrder = memoryOrders.find((o) => o.orderNumber === orderNumber);
  if (localOrder) {
    localOrder.status = status;
  }

  // Real-time broadcast for live WebSockets / cross-tab synchronization
  realtimeService.broadcastOrderStatus(orderNumber, status);

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, orderNumber],
    });
    return true;
  } catch (error) {
    console.warn('Turso updateOrderStatus offline fallback:', error);
    return true;
  }
}

export async function deleteOrder(orderNumber: string): Promise<boolean> {
  deletedOrderIds.add(orderNumber);
  const idx = memoryOrders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx >= 0) {
    memoryOrders.splice(idx, 1);
  }

  // Real-time broadcast for live WebSockets / cross-tab synchronization
  realtimeService.broadcastOrderDeleted(orderNumber);

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: 'DELETE FROM orders WHERE id = ?',
      args: [orderNumber],
    });
    return true;
  } catch (error) {
    console.warn('Turso deleteOrder offline fallback:', error);
    return true;
  }
}
