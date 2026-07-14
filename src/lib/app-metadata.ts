import packageJson from '../../package.json'

export const APP_METADATA = {
  name: 'TechFix Pro',
  edition: process.env.NEXT_PUBLIC_APP_EDITION || 'Edition CAM',
  version: packageJson.version,
  releaseType: 'Fix Update',
  desktopTarget: 'Linux / Windows Desktop',
  description: 'Sistema de gestión para taller de reparación y venta de laptops.',
} as const

export function getAppDisplayVersion() {
  return `v${APP_METADATA.version}`
}

export function getAppFullName() {
  return `${APP_METADATA.name} ${APP_METADATA.edition}`
}
