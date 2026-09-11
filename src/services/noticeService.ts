import { getTursoClient, initTursoDatabase } from '../lib/turso';
import { type Notice, NOTICES } from '../app/data/notices';

export async function fetchNotices(): Promise<Notice[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM notices ORDER BY is_featured DESC, created_at DESC');

    if (res.rows.length > 0) {
      return res.rows.map((row) => {
        let content: string[] = [];
        try {
          const parsed = JSON.parse(String(row.content ?? '[]'));
          content = Array.isArray(parsed) ? parsed : [String(row.content)];
        } catch {
          content = [String(row.content ?? '')];
        }

        return {
          id: String(row.id),
          title: String(row.title),
          date: String(row.date),
          category: String(row.category),
          readTime: String(row.read_time ?? '2 min de lectura'),
          tagColor: String(row.tag_color ?? 'bg-orange-100 text-orange-800 border-orange-200'),
          author: String(row.author ?? 'Supermercado Osos'),
          summary: String(row.excerpt ?? ''),
          content,
        };
      });
    }
  } catch (error) {
    console.warn('Turso fetchNotices offline fallback to static notices:', error);
  }

  return [...NOTICES];
}
