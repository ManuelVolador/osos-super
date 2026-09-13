import { getTursoClient, initTursoDatabase } from '../lib/turso';

const memorySubscribers = new Set<string>();

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (memorySubscribers.has(cleanEmail)) {
    return {
      success: true,
      message: '¡Ya estás registrado en nuestro boletín de ofertas y novedades!',
    };
  }

  memorySubscribers.add(cleanEmail);

  try {
    await initTursoDatabase();
    const client = getTursoClient();

    // Check if subscriber exists in Turso
    const checkRes = await client.execute({
      sql: 'SELECT id FROM subscribers WHERE email = ?',
      args: [cleanEmail],
    });

    if (checkRes.rows.length > 0) {
      return {
        success: true,
        message: '¡Ya estás registrado en nuestro boletín de ofertas y novedades!',
      };
    }

    const id = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await client.execute({
      sql: 'INSERT INTO subscribers (id, email) VALUES (?, ?)',
      args: [id, cleanEmail],
    });

    return {
      success: true,
      message: '¡Gracias por suscribirte! Te mantendremos al tanto de las mejores ofertas de ahorro.',
    };
  } catch (error) {
    console.warn('Turso subscribeNewsletter offline fallback:', error);
    return {
      success: true,
      message: '¡Gracias por suscribirte! Te mantendremos al tanto de las mejores ofertas de ahorro.',
    };
  }
}

export async function fetchSubscribers(): Promise<{ id: string; email: string; createdAt: string }[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM subscribers ORDER BY created_at DESC');

    if (res.rows.length > 0) {
      const dbSubs = res.rows.map((row) => ({
        id: String(row.id),
        email: String(row.email),
        createdAt: String(row.created_at ?? ''),
      }));

      const existingEmails = new Set(dbSubs.map((s) => s.email.toLowerCase()));
      const pendingMemory = Array.from(memorySubscribers)
        .filter((email) => !existingEmails.has(email.toLowerCase()))
        .map((email, idx) => ({
          id: `mem-sub-${idx}`,
          email,
          createdAt: new Date().toISOString(),
        }));

      return [...pendingMemory, ...dbSubs];
    }
  } catch (error) {
    console.warn('Turso fetchSubscribers offline fallback:', error);
  }

  return Array.from(memorySubscribers).map((email, idx) => ({
    id: `mem-sub-${idx}`,
    email,
    createdAt: new Date().toISOString(),
  }));
}
