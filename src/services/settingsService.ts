import { getTursoClient, initTursoDatabase } from '../lib/turso';

export interface StoreSettings {
  storeName: string;
  whatsappPhone: string;
  address: string;
  openingHours: string;
  bannerNotice: string;
  deliveryFee: number;
  adminPin: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Supermercado Osos',
  whatsappPhone: '+57 310 123 4567',
  address: 'Calle 30 # 29-15, Santa Rosa de Osos (Antioquia)',
  openingHours: 'Lunes a Sábado: 7:00 a.m. – 8:00 p.m. | Domingos: 8:00 a.m. – 5:00 p.m.',
  bannerNotice: 'Envíos a domicilio en todo el casco urbano de Santa Rosa de Osos y veredas aledañas.',
  deliveryFee: 4000,
  adminPin: 'admin2026',
};

const LOCAL_SETTINGS_KEY = 'osos_store_settings';

export async function fetchStoreSettings(): Promise<StoreSettings> {
  let localData: Partial<StoreSettings> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (raw) localData = JSON.parse(raw);
    } catch {
      // Ignore storage parse error
    }
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT key, value FROM store_settings');
    if (res.rows.length > 0) {
      const dbData: Record<string, string> = {};
      for (const row of res.rows) {
        dbData[String(row.key)] = String(row.value);
      }

      return {
        ...DEFAULT_STORE_SETTINGS,
        ...localData,
        storeName: dbData.storeName || localData.storeName || DEFAULT_STORE_SETTINGS.storeName,
        whatsappPhone: dbData.whatsappPhone || localData.whatsappPhone || DEFAULT_STORE_SETTINGS.whatsappPhone,
        address: dbData.address || localData.address || DEFAULT_STORE_SETTINGS.address,
        openingHours: dbData.openingHours || localData.openingHours || DEFAULT_STORE_SETTINGS.openingHours,
        bannerNotice: dbData.bannerNotice || localData.bannerNotice || DEFAULT_STORE_SETTINGS.bannerNotice,
        deliveryFee: dbData.deliveryFee ? Number(dbData.deliveryFee) : (localData.deliveryFee ?? DEFAULT_STORE_SETTINGS.deliveryFee),
        adminPin: dbData.adminPin || localData.adminPin || DEFAULT_STORE_SETTINGS.adminPin,
      };
    }
  } catch (error) {
    console.warn('Turso fetchStoreSettings offline fallback:', error);
  }

  return {
    ...DEFAULT_STORE_SETTINGS,
    ...localData,
  };
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
  const current = await fetchStoreSettings();
  const updated: StoreSettings = { ...current, ...settings };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage error
    }
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const statements = Object.entries(updated).map(([key, value]) => ({
      sql: 'INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)',
      args: [key, String(value)],
    }));
    await client.batch(statements, 'write');
  } catch (error) {
    console.warn('Turso saveStoreSettings offline fallback:', error);
  }

  return updated;
}
