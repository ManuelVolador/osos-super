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
