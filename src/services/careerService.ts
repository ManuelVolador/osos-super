import { getTursoClient, initTursoDatabase } from '../lib/turso';

export interface JobApplicationInput {
  fullName?: string;
  name?: string;
  phone?: string;
  email: string;
  position?: string;
  message?: string;
  cvFilename?: string;
}

const memoryJobApplications: (JobApplicationInput & { id: string; createdAt: string })[] = [];

export async function saveJobApplication(data: JobApplicationInput): Promise<boolean> {
  const id = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullName = data.fullName || data.name || 'Candidato';
  const createdAt = new Date().toISOString();

  memoryJobApplications.push({
    ...data,
    fullName,
    id,
    createdAt,
  });

  try {
    await initTursoDatabase();
    const client = getTursoClient();

    await client.execute({
      sql: `INSERT INTO job_applications (id, full_name, phone, email, position, message, cv_filename)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        fullName,
        data.phone || '',
        data.email,
        data.position || 'General',
        data.message || '',
        data.cvFilename || '',
      ],
    });

    return true;
  } catch (error) {
    console.warn('Turso saveJobApplication offline fallback:', error);
    return true;
  }
}
