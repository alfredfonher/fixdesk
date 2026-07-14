export function buildBackupArtifact(data: unknown, exportedAt = new Date()) {
  return {
    version: '2.0',
    exportDate: exportedAt.toISOString(),
    app: 'TechFix Pro',
    data,
  }
}
