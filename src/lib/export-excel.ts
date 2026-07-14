import * as XLSX from 'xlsx'

export interface ExportColumn {
  header: string
  key: string
  width?: number
}

export function exportToExcel(data: Record<string, unknown>[], columns: ExportColumn[], filename: string) {
  const wsData = [
    columns.map(c => c.header),
    ...data.map(row => columns.map(c => {
      const val = row[c.key]
      if (val instanceof Date) return val.toLocaleDateString('es-ES')
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
        return new Date(val).toLocaleDateString('es-ES')
      }
      return val ?? ''
    }))
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Datos')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
