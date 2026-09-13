import { getTursoClient, initTursoDatabase } from '../lib/turso';

export interface ContactMessageInput {
  name?: string;
  email: string;
  phone?: string;
  message?: string;
}

const memoryContactMessages: (ContactMessageInput & { id: string; createdAt: string })[] = [];

export async function saveContactMessage(data: ContactMessageInput): Promise<boolean> {
  const id = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = new Date().toISOString();

  memoryContactMessages.push({
    ...data,
    id,
    createdAt,
  });

  try {
    await initTursoDatabase();
    const client = getTursoClient();

    await client.execute({
      sql: `INSERT INTO contact_messages (id, name, email, phone, message)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        id,
        data.name || 'Cliente',
        data.email,
        data.phone || '',
        data.message || '',
      ],
    });

    return true;
  } catch (error) {
    console.warn('Turso saveContactMessage offline fallback:', error);
    return true;
  }
}

export async function fetchContactMessages(): Promise<(ContactMessageInput & { id: string; createdAt: string })[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');

    if (res.rows.length > 0) {
      const dbMsgs = res.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name ?? 'Cliente'),
        email: String(row.email ?? ''),
        phone: String(row.phone ?? ''),
        message: String(row.message ?? ''),
        createdAt: String(row.created_at ?? ''),
      }));

      const existingIds = new Set(dbMsgs.map((m) => m.id));
      const pendingMemory = memoryContactMessages.filter((m) => !existingIds.has(m.id));
      return [...pendingMemory, ...dbMsgs];
    }
  } catch (error) {
    console.warn('Turso fetchContactMessages offline fallback:', error);
  }

  return [...memoryContactMessages];
}
