import { getTursoClient, initTursoDatabase } from '../lib/turso';
import { type Notice, NOTICES } from '../app/data/notices';

const LOCAL_STORAGE_KEY = 'osos_custom_notices';
const LOCAL_DELETED_NOTICES_KEY = 'osos_deleted_notices';
const memoryNotices: Notice[] = [];
const memoryDeletedNotices = new Set<string>();

function getLocalDeletedNoticeIds(): Set<string> {
  if (typeof window === 'undefined') return memoryDeletedNotices;
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_NOTICES_KEY);
    return raw ? new Set(JSON.parse(raw)) : memoryDeletedNotices;
  } catch {
    return memoryDeletedNotices;
  }
}

function getLocalStoredNotices(): Notice[] {
  if (typeof window === 'undefined') return memoryNotices;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return memoryNotices;
  }
}

function saveLocalNotice(notice: Notice) {
  if (typeof window === 'undefined') {
    memoryNotices.unshift(notice);
    memoryDeletedNotices.delete(notice.id);
    return;
  }
  try {
    const current = getLocalStoredNotices();
    const updated = [notice, ...current.filter((n) => n.id !== notice.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    const deleted = getLocalDeletedNoticeIds();
    if (deleted.has(notice.id)) {
      deleted.delete(notice.id);
      localStorage.setItem(LOCAL_DELETED_NOTICES_KEY, JSON.stringify(Array.from(deleted)));
    }
  } catch {
    memoryNotices.unshift(notice);
  }
}

export async function fetchNotices(): Promise<Notice[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM notices ORDER BY is_featured DESC, created_at DESC');

    if (res.rows.length > 0) {
      const tursoNotices: Notice[] = res.rows.map((row) => {
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
          tagColor: String(row.tag_color ?? 'bg-stone-100 text-stone-700 border-stone-200'),
          author: String(row.author ?? 'Supermercado Osos'),
          summary: String(row.excerpt ?? ''),
          content,
          image: row.image ? String(row.image) : undefined,
          featured: Boolean(row.is_featured),
        };
      });

      // Filter deleted notices
      const deletedIds = getLocalDeletedNoticeIds();
      const validTursoNotices = tursoNotices.filter((n) => !deletedIds.has(n.id));

      // Merge with any local offline-created notices that might not be in Turso yet
      const local = getLocalStoredNotices().filter((n) => !deletedIds.has(n.id));
      const existingIds = new Set(validTursoNotices.map((n) => n.id));
      const pendingLocal = local.filter((n) => !existingIds.has(n.id));

      return [...pendingLocal, ...validTursoNotices];
    }
  } catch (error) {
    console.warn('Turso fetchNotices offline fallback to static notices:', error);
  }

  // Fallback: merge local stored + static notices
  const deletedIds = getLocalDeletedNoticeIds();
  const local = getLocalStoredNotices().filter((n) => !deletedIds.has(n.id));
  const allStatic = NOTICES.filter((n) => !deletedIds.has(n.id));
  const existingIds = new Set(local.map((n) => n.id));
  const merged = [...local, ...allStatic.filter((n) => !existingIds.has(n.id))];

  return merged;
}

export type CreateNoticeInput = {
  id?: string;
  title: string;
  summary: string;
  content?: string[];
  category?: string;
  date?: string;
  readTime?: string;
  author?: string;
  tagColor?: string;
  image?: string;
  featured?: boolean;
};

export async function saveNotice(noticeData: CreateNoticeInput): Promise<Notice> {
  const newNotice: Notice = {
    id: noticeData.id || `aviso-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: noticeData.title.trim(),
    date: noticeData.date || new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()),
    category: (noticeData.category ? noticeData.category.trim() : '') || 'General',
    readTime: noticeData.readTime || `${Math.max(1, Math.ceil((noticeData.content?.join(' ').split(/\s+/).length || 100) / 180))} min de lectura`,
    tagColor: noticeData.tagColor || 'bg-stone-100 text-stone-700 border-stone-200',
    author: (noticeData.author ? noticeData.author.trim() : '') || 'Equipo Editorial Osos',
    summary: noticeData.summary.trim(),
    content: Array.isArray(noticeData.content) && noticeData.content.length > 0 ? noticeData.content : [noticeData.summary],
    image: noticeData.image,
    featured: noticeData.featured ?? false,
  };

  saveLocalNotice(newNotice);

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: `INSERT OR REPLACE INTO notices (
        id, title, excerpt, content, category, date, read_time, author, tag_color, image, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newNotice.id,
        newNotice.title,
        newNotice.summary,
        JSON.stringify(newNotice.content),
        newNotice.category,
        newNotice.date,
        newNotice.readTime,
        newNotice.author,
        newNotice.tagColor,
        newNotice.image ?? null,
        newNotice.featured ? 1 : 0,
      ],
    });
  } catch (error) {
    console.warn('Turso saveNotice offline fallback to local storage:', error);
  }

  return newNotice;
}

export async function deleteNotice(noticeId: string): Promise<boolean> {
  memoryDeletedNotices.add(noticeId);
  const local = getLocalStoredNotices().filter((n) => n.id !== noticeId);
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    const deleted = getLocalDeletedNoticeIds();
    deleted.add(noticeId);
    localStorage.setItem(LOCAL_DELETED_NOTICES_KEY, JSON.stringify(Array.from(deleted)));
  } catch {
    // Ignore storage errors
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: 'DELETE FROM notices WHERE id = ?',
      args: [noticeId],
    });
    return true;
  } catch (error) {
    console.warn('Turso deleteNotice offline fallback:', error);
    return true;
  }
}
