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
