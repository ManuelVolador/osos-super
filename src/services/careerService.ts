import { getTursoClient, initTursoDatabase } from '../lib/turso';

export type JobApplicationStatus = 'pendiente' | 'en_revision' | 'entrevistado' | 'seleccionado' | 'descartado';

export interface JobApplicationInput {
  fullName?: string;
  name?: string;
  phone?: string;
  email: string;
  position?: string;
  message?: string;
  cvFilename?: string;
  status?: JobApplicationStatus;
  date?: string;
}

export type JobApplication = JobApplicationInput & {
  id: string;
  createdAt: string;
  status: JobApplicationStatus;
  date: string;
};

const memoryJobApplications: JobApplication[] = [];

export async function saveJobApplication(data: JobApplicationInput): Promise<boolean> {
  const id = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullName = data.fullName || data.name || 'Candidato';
  const createdAt = new Date().toISOString();
  const status: JobApplicationStatus = data.status || 'pendiente';
  const date = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const app: JobApplication = {
    ...data,
    fullName,
    id,
    createdAt,
    status,
    date,
  };

  memoryJobApplications.unshift(app);

  try {
    await initTursoDatabase();
    const client = getTursoClient();

    await client.execute({
      sql: `INSERT INTO job_applications (id, full_name, phone, email, position, message, cv_filename, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        fullName,
        data.phone || '',
        data.email,
        data.position || 'General',
        data.message || '',
        data.cvFilename || '',
        status,
      ],
    });

    return true;
  } catch (error) {
    console.warn('Turso saveJobApplication offline fallback:', error);
    return true;
  }
}

export async function updateJobApplicationStatus(id: string, status: JobApplicationStatus): Promise<boolean> {
  // Update in-memory
  const match = memoryJobApplications.find((a) => a.id === id);
  if (match) {
    match.status = status;
  }

  try {
    await initTursoDatabase();
    const client = getTursoClient();
    await client.execute({
      sql: 'UPDATE job_applications SET status = ? WHERE id = ?',
      args: [status, id],
    });
    return true;
  } catch (error) {
    console.warn('Turso updateJobApplicationStatus offline fallback:', error);
    return true;
  }
}

export async function fetchJobApplications(): Promise<JobApplication[]> {
  try {
    await initTursoDatabase();
    const client = getTursoClient();
    const res = await client.execute('SELECT * FROM job_applications ORDER BY created_at DESC');

    if (res.rows.length > 0) {
      const dbApps: JobApplication[] = res.rows.map((row) => {
        const rawDate = String(row.created_at ?? '');
        let formattedDate = rawDate;
        try {
          if (rawDate) {
            formattedDate = new Date(rawDate).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          // fallback
        }

        return {
          id: String(row.id),
          fullName: String(row.full_name ?? 'Candidato'),
          phone: String(row.phone ?? ''),
          email: String(row.email ?? ''),
          position: String(row.position ?? 'General'),
          message: String(row.message ?? ''),
          cvFilename: String(row.cv_filename ?? ''),
          status: (String(row.status || 'pendiente') as JobApplicationStatus),
          createdAt: rawDate,
          date: formattedDate || 'Reciente',
        };
      });

      // Merge memory apps not in Turso
      const existingIds = new Set(dbApps.map((a) => a.id));
      const pendingMemory = memoryJobApplications.filter((a) => !existingIds.has(a.id));
      return [...pendingMemory, ...dbApps];
    }
  } catch (error) {
    console.warn('Turso fetchJobApplications offline fallback:', error);
  }

  return [...memoryJobApplications];
}
