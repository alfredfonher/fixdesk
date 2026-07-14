// Opciones de selección para especificaciones de laptop
export const STORAGE_TYPES = [
  { value: 'SSD', label: 'SSD (Solid State Drive)' },
  { value: 'SSD SATA', label: 'SSD SATA' },
  { value: 'HDD', label: 'HDD (Hard Disk Drive)' },
  { value: 'M.2 SATA', label: 'M.2 SATA' },
  { value: 'M.2 NVMe', label: 'M.2 NVMe' },
  { value: 'eMMC', label: 'eMMC' },
] as const

export const STORAGE_CAPACITIES = [
  { value: '128GB', label: '128 GB' },
  { value: '256GB', label: '256 GB' },
  { value: '512GB', label: '512 GB' },
  { value: '1TB', label: '1 TB' },
  { value: '2TB', label: '2 TB' },
  { value: '4TB', label: '4 TB' },
] as const

export const RAM_TYPES = [
  { value: 'DDR3', label: 'DDR3' },
  { value: 'DDR3L', label: 'DDR3L' },
  { value: 'DDR4', label: 'DDR4' },
  { value: 'DDR5', label: 'DDR5' },
  { value: 'LPDDR4', label: 'LPDDR4' },
  { value: 'LPDDR4X', label: 'LPDDR4X' },
  { value: 'LPDDR5', label: 'LPDDR5' },
  { value: 'LPDDR5X', label: 'LPDDR5X' },
] as const

export const RAM_SIZES = [
  { value: '2GB', label: '2 GB' },
  { value: '4GB', label: '4 GB' },
  { value: '6GB', label: '6 GB' },
  { value: '8GB', label: '8 GB' },
  { value: '12GB', label: '12 GB' },
  { value: '16GB', label: '16 GB' },
  { value: '32GB', label: '32 GB' },
  { value: '64GB', label: '64 GB' },
] as const

export const RAM_STICKS = [
  { value: '1x', label: '1 módulo' },
  { value: '2x', label: '2 módulos' },
  { value: '3x', label: '3 módulos' },
  { value: '4x', label: '4 módulos' },
] as const

export const GPU_MODELS = [
  { value: 'Intel HD 4400', label: 'Intel HD 4400' },
  { value: 'Intel HD 4600', label: 'Intel HD 4600' },
  { value: 'Intel HD 520', label: 'Intel HD 520' },
  { value: 'Intel HD 530', label: 'Intel HD 530' },
  { value: 'Intel UHD 620', label: 'Intel UHD 620' },
  { value: 'Intel UHD 630', label: 'Intel UHD 630' },
  { value: 'Intel Iris Xe', label: 'Intel Iris Xe' },
  { value: 'Intel UHD 770', label: 'Intel UHD 770' },
  { value: 'NVIDIA GeForce MX110', label: 'NVIDIA MX110' },
  { value: 'NVIDIA GeForce MX130', label: 'NVIDIA MX130' },
  { value: 'NVIDIA GeForce MX150', label: 'NVIDIA MX150' },
  { value: 'NVIDIA GeForce MX250', label: 'NVIDIA MX250' },
  { value: 'NVIDIA GeForce MX330', label: 'NVIDIA MX330' },
  { value: 'NVIDIA GeForce MX350', label: 'NVIDIA MX350' },
  { value: 'NVIDIA GeForce MX450', label: 'NVIDIA MX450' },
  { value: 'NVIDIA GeForce MX550', label: 'NVIDIA MX550' },
  { value: 'NVIDIA GeForce GTX 950M', label: 'NVIDIA GTX 950M' },
  { value: 'NVIDIA GeForce GTX 960M', label: 'NVIDIA GTX 960M' },
  { value: 'NVIDIA GeForce GTX 1050', label: 'NVIDIA GTX 1050' },
  { value: 'NVIDIA GeForce GTX 1050 Ti', label: 'NVIDIA GTX 1050 Ti' },
  { value: 'NVIDIA GeForce GTX 1060', label: 'NVIDIA GTX 1060' },
  { value: 'NVIDIA GeForce GTX 1070', label: 'NVIDIA GTX 1070' },
  { value: 'NVIDIA GeForce GTX 1650', label: 'NVIDIA GTX 1650' },
  { value: 'NVIDIA GeForce GTX 1650 Ti', label: 'NVIDIA GTX 1650 Ti' },
  { value: 'NVIDIA GeForce GTX 1660 Ti', label: 'NVIDIA GTX 1660 Ti' },
  { value: 'NVIDIA GeForce RTX 3050', label: 'NVIDIA RTX 3050' },
  { value: 'NVIDIA GeForce RTX 3050 Ti', label: 'NVIDIA RTX 3050 Ti' },
  { value: 'NVIDIA GeForce RTX 3060', label: 'NVIDIA RTX 3060' },
  { value: 'NVIDIA GeForce RTX 3070', label: 'NVIDIA RTX 3070' },
  { value: 'NVIDIA GeForce RTX 3080', label: 'NVIDIA RTX 3080' },
  { value: 'NVIDIA GeForce RTX 4050', label: 'NVIDIA RTX 4050' },
  { value: 'NVIDIA GeForce RTX 4060', label: 'NVIDIA RTX 4060' },
  { value: 'NVIDIA GeForce RTX 4070', label: 'NVIDIA RTX 4070' },
  { value: 'NVIDIA GeForce RTX 4080', label: 'NVIDIA RTX 4080' },
  { value: 'NVIDIA GeForce RTX 4090', label: 'NVIDIA RTX 4090' },
  { value: 'AMD Radeon Vega 3', label: 'AMD Vega 3' },
  { value: 'AMD Radeon Vega 6', label: 'AMD Vega 6' },
  { value: 'AMD Radeon Vega 7', label: 'AMD Vega 7' },
  { value: 'AMD Radeon Vega 8', label: 'AMD Vega 8' },
  { value: 'AMD Radeon Vega 10', label: 'AMD Vega 10' },
  { value: 'AMD Radeon Vega 11', label: 'AMD Vega 11' },
  { value: 'AMD Radeon 610M', label: 'AMD Radeon 610M' },
  { value: 'AMD Radeon 680M', label: 'AMD Radeon 680M' },
  { value: 'AMD Radeon 780M', label: 'AMD Radeon 780M' },
  { value: 'AMD Radeon RX 540', label: 'AMD RX 540' },
  { value: 'AMD Radeon RX 550', label: 'AMD RX 550' },
  { value: 'AMD Radeon RX 560', label: 'AMD RX 560' },
  { value: 'AMD Radeon RX 5500M', label: 'AMD RX 5500M' },
  { value: 'AMD Radeon RX 5700M', label: 'AMD RX 5700M' },
  { value: 'AMD Radeon RX 6600M', label: 'AMD RX 6600M' },
  { value: 'AMD Radeon RX 6700M', label: 'AMD RX 6700M' },
  { value: 'AMD Radeon RX 6800M', label: 'AMD RX 6800M' },
  { value: 'AMD Radeon RX 7600M', label: 'AMD RX 7600M' },
  { value: 'AMD Radeon RX 7700M', label: 'AMD RX 7700M' },
  { value: 'Sin GPU dedicada', label: 'Sin GPU dedicada' },
  { value: 'Otra', label: 'Otra (especificar)' },
] as const

export const VRAM_SIZES = [
  { value: '2GB', label: '2 GB' },
  { value: '3GB', label: '3 GB' },
  { value: '4GB', label: '4 GB' },
  { value: '6GB', label: '6 GB' },
  { value: '8GB', label: '8 GB' },
  { value: '10GB', label: '10 GB' },
  { value: '12GB', label: '12 GB' },
  { value: '16GB', label: '16 GB' },
  { value: '24GB', label: '24 GB' },
] as const

export const VRAM_TYPES = [
  { value: 'GDDR5', label: 'GDDR5' },
  { value: 'GDDR6', label: 'GDDR6' },
  { value: 'GDDR6X', label: 'GDDR6X' },
  { value: 'HBM2', label: 'HBM2' },
  { value: 'HBM2e', label: 'HBM2e' },
  { value: 'HBM3', label: 'HBM3' },
] as const

export const REPAIR_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: 'bg-amber-500' },
  { value: 'in_progress', label: 'En Progreso', color: 'bg-sky-500' },
  { value: 'completed', label: 'Completada', color: 'bg-emerald-500' },
  { value: 'delivered', label: 'Entregada', color: 'bg-violet-500' },
] as const

export const SALE_TYPES = [
  { value: 'refurbished_own', label: 'Reacondicionada Propia', warrantyDays: 15 },
  { value: 'refurbished_imported', label: 'Reacondicionada Importada', warrantyDays: 30 },
] as const

export const INVENTORY_CATEGORIES = [
  { value: 'storage', label: 'Almacenamiento' },
  { value: 'ram', label: 'Memoria RAM' },
  { value: 'screen', label: 'Pantalla' },
  { value: 'battery', label: 'Batería' },
  { value: 'keyboard', label: 'Teclado' },
  { value: 'charger', label: 'Cargador' },
  { value: 'motherboard', label: 'Placa Madre' },
  { value: 'fan', label: 'Ventilador' },
  { value: 'cable', label: 'Cable / Conector' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'other', label: 'Otro' },
] as const

export const INVENTORY_STATUSES = [
  { value: 'available', label: 'Disponible' },
  { value: 'sold', label: 'Vendida' },
  { value: 'reserved', label: 'Reservada' },
] as const

export const INVENTORY_SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'purchase', label: 'Compra' },
] as const

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En Progreso',
  completed: 'Completada',
  delivered: 'Entregada',
}

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-info/10 text-info border-info/30',
  completed: 'bg-success/10 text-success border-success/30',
  delivered: 'bg-brand/10 text-brand border-brand/30',
}

export const SALE_TYPE_LABELS: Record<string, string> = {
  refurbished_own: 'Reacondicionada Propia',
  refurbished_imported: 'Reacondicionada Importada',
}

export const CATEGORY_LABELS: Record<string, string> = {
  storage: 'Almacenamiento',
  ram: 'Memoria RAM',
  screen: 'Pantalla',
  battery: 'Batería',
  keyboard: 'Teclado',
  charger: 'Cargador',
  motherboard: 'Placa Madre',
  fan: 'Ventilador',
  cable: 'Cable / Conector',
  laptop: 'Laptop',
  other: 'Otro',
}

export const INVENTORY_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  sold: 'Vendida',
  reserved: 'Reservada',
}

export const INVENTORY_SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  purchase: 'Compra',
}

export const LEDGER_TYPES = [
  { value: 'income', label: 'Ingreso' },
  { value: 'expense', label: 'Egreso' },
  { value: 'adjustment', label: 'Ajuste' },
] as const

export const WARRANTY_STATUSES = [
  { value: 'active', label: 'Vigente', color: 'bg-emerald-500' },
  { value: 'expiring', label: 'Por Vencer', color: 'bg-amber-500' },
  { value: 'expired', label: 'Vencida', color: 'bg-rose-500' },
] as const

export const WARRANTY_STATUS_LABELS: Record<string, string> = {
  active: 'Vigente',
  expiring: 'Por Vencer',
  expired: 'Vencida',
}

export const WARRANTY_STATUS_COLORS: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  expiring: 'bg-warning/10 text-warning border-warning/30',
  expired: 'bg-danger/10 text-danger border-danger/30',
}

export const WARRANTY_ORIGIN_LABELS: Record<string, string> = {
  repair: 'Reparación',
  sale: 'Venta',
}

export interface WarrantyItem {
  id: string
  origin: 'repair' | 'sale'
  brand: string
  model: string
  client: string
  clientId: string
  startDate: string
  warrantyExpires: string | null
  daysRemaining: number | null
  status: 'active' | 'expiring' | 'expired'
  saleType?: string
}

const EXPIRING_SOON_DAYS = 15

export function buildWarrantyItem(
  id: string,
  origin: 'repair' | 'sale',
  brand: string,
  model: string,
  client: string,
  clientId: string,
  startDate: string,
  warrantyExpires: string | null,
  saleType?: string,
): WarrantyItem {
  const now = new Date()
  const expiry = warrantyExpires ? new Date(warrantyExpires) : null
  const daysRemaining = expiry
    ? Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
    : null
  const status: WarrantyItem['status'] =
    daysRemaining === null
    ? 'expired'
    : daysRemaining <= 0
    ? 'expired'
    : daysRemaining <= EXPIRING_SOON_DAYS
    ? 'expiring'
    : 'active'

  return { id, origin, brand, model, client, clientId, startDate, warrantyExpires, daysRemaining, status, saleType }
}

export function repairToWarrantyItem(r: Repair): WarrantyItem {
  return buildWarrantyItem(
    r.id, 'repair', r.brand, r.model,
    r.client?.name ?? '', r.clientId,
    r.repairDate, r.warrantyExpires,
  )
}

export function saleToWarrantyItem(s: Sale): WarrantyItem {
  return buildWarrantyItem(
    s.id, 'sale', s.brand, s.model,
    s.client?.name ?? '', s.clientId,
    s.saleDate, s.warrantyExpires,
    s.saleType,
  )
}

export const LEDGER_SOURCE_TYPES = [
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
  { value: 'repair', label: 'Reparación' },
  { value: 'manual', label: 'Manual' },
] as const

export const LEDGER_STATUSES = [
  { value: 'posted', label: 'Registrado' },
  { value: 'cancelled', label: 'Cancelado' },
] as const

export const LEDGER_TYPE_LABELS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
  adjustment: 'Ajuste',
}

export const LEDGER_STATUS_LABELS: Record<string, string> = {
  posted: 'Registrado',
  cancelled: 'Cancelado',
}

export interface Client {
  id: string
  name: string
  address: string
  mobile: string
  email: string
  createdAt: string
  updatedAt: string
  _count?: { repairs: number; purchases: number; sales: number }
}

export interface Repair {
  id: string
  clientId: string
  client?: Client
  brand: string
  model: string
  storageType: string
  storageCapacity: string
  ramType: string
  ramSize: string
  ramSticks: string
  gpuModel: string
  vramSize: string
  vramType: string
  faultDescription: string
  proposedPrice: number
  status: string
  notes: string
  repairDate: string
  warrantyExpires: string | null
  createdAt: string
  updatedAt: string
}

export type RepairOrder = Repair

export interface Purchase {
  id: string
  clientId: string
  client?: Client
  brand: string
  model: string
  storageType: string
  storageCapacity: string
  ramType: string
  ramSize: string
  ramSticks: string
  gpuModel: string
  vramSize: string
  vramType: string
  purchasePrice: number
  description: string
  notes: string
  purchaseDate: string
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: string
  clientId: string
  client?: Client
  brand: string
  model: string
  storageType: string
  storageCapacity: string
  ramType: string
  ramSize: string
  ramSticks: string
  gpuModel: string
  vramSize: string
  vramType: string
  saleType: string
  salePrice: number
  description: string
  notes: string
  saleDate: string
  warrantyDays: number
  warrantyExpires: string | null
  inventoryItemId: string | null
  inventoryItem?: InventoryItem
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  category: string
  name: string
  type: string
  capacity: string
  quantity: number
  price: number
  description: string
  purchaseId: string | null
  source: string
  status: string
  brand: string
  ramType: string
  ramSize: string
  ramSticks: string
  gpuModel: string
  vramSize: string
  vramType: string
  storageType: string
  storageCapacity: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalClients: number
  totalRepairs: number
  pendingRepairs: number
  inProgressRepairs: number
  completedRepairs: number
  deliveredRepairs: number
  totalPurchases: number
  totalSales: number
  totalInventoryItems: number
  lowStockItems: number
  totalRepairRevenue: number
  totalPurchaseCosts: number
  totalSalesRevenue: number
  totalIncome: number
  netProfit: number
  recentRepairs: Repair[]
  recentPurchases: Purchase[]
  recentSales: Sale[]
  expiringWarranties: Array<{
    id: string
    type: 'repair' | 'sale'
    brand: string
    model: string
    client: string
    warrantyExpires: string
  }>
}

export interface LedgerEntry {
  id: string
  type: string
  sourceType: string
  sourceId: string
  amount: number
  currency: string
  exchangeRate: number
  description: string
  reference: string
  status: string
  createdAt: string
  updatedAt: string
}
