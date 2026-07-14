export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-side'
  }

  const STORAGE_KEY = 'techfix_device_id'
  let deviceId = localStorage.getItem(STORAGE_KEY)

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }

  return deviceId
}

export function clearDeviceId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('techfix_device_id')
  }
}