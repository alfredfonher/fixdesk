"use client"

import { useState, useEffect, useRef } from "react"
import { Repair, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeviceSpecsSelector } from "@/components/device-specs-selector"
import { ClientSelectCreate } from "@/components/client-select-create"
import {
  Search, Wrench, ChevronRight, Shield, Calendar,
  Clock, CheckCircle2, Truck,
} from "lucide-react"
import { toast } from "sonner"
import Swal from "sweetalert2"

interface RepairsViewProps {
  isAuthenticated: boolean
  onRequestEdit: (recordId: string, recordName: string, callback: () => void) => void
  editingRecordId: string | null
  clearEdit: () => void
  canUseAdvancedSpecs?: boolean
}

export function RepairsView({ isAuthenticated, onRequestEdit, editingRecordId, clearEdit, canUseAdvancedSpecs = true }: RepairsViewProps) {
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
  const prevSelectedRepairIdRef = useRef<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Form
  const [formClientId, setFormClientId] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formModel, setFormModel] = useState("")
  const [formStorageType, setFormStorageType] = useState("")
  const [formStorageCapacity, setFormStorageCapacity] = useState("")
  const [formRamType, setFormRamType] = useState("")
  const [formRamSize, setFormRamSize] = useState("")
  const [formRamSticks, setFormRamSticks] = useState("")
  const [formGpuModel, setFormGpuModel] = useState("")
  const [formVramSize, setFormVramSize] = useState("")
  const [formVramType, setFormVramType] = useState("")
  const [formFault, setFormFault] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formRepairDate, setFormRepairDate] = useState(new Date().toISOString().split('T')[0])
  const [formStatus, setFormStatus] = useState("pending")
  const [submitting, setSubmitting] = useState(false)

  const refreshRepairs = async () => {
    try {
      const res = await fetch("/api/repairs")
      const data = await res.json()
      setRepairs(data)
    } catch { }
  }

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const res = await fetch("/api/repairs")
        const data = await res.json()
        setRepairs(data)
      } catch { } finally { setLoading(false) }
    }

    fetchRepairs()
  }, [])

  // Clear edit authorization when switching to a different repair
  useEffect(() => {
    if (prevSelectedRepairIdRef.current !== null && selectedRepair?.id !== prevSelectedRepairIdRef.current) {
      clearEdit()
    }
    prevSelectedRepairIdRef.current = selectedRepair?.id ?? null
  }, [selectedRepair?.id, clearEdit])

  const filtered = repairs.filter(r => {
    const matchSearch = !search ||
      r.brand?.toLowerCase().includes(search.toLowerCase()) ||
      r.model?.toLowerCase().includes(search.toLowerCase()) ||
      r.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.faultDescription?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const resetForm = () => {
    setFormClientId(""); setFormBrand(""); setFormModel("")
    setFormStorageType(""); setFormStorageCapacity("")
    setFormRamType(""); setFormRamSize("")
    setFormRamSticks(""); setFormGpuModel(""); setFormVramSize(""); setFormVramType("")
    setFormFault(""); setFormPrice(""); setFormNotes("")
    setFormRepairDate(new Date().toISOString().split('T')[0])
    setFormStatus("pending"); setEditMode(false)
  }

  const handleSpecChange = (field: string, value: string) => {
    switch (field) {
      case "brand": setFormBrand(value); break
      case "model": setFormModel(value); break
      case "storageType": setFormStorageType(value); break
      case "storageCapacity": setFormStorageCapacity(value); break
      case "ramType": setFormRamType(value); break
      case "ramSize": setFormRamSize(value); break
      case "ramSticks": setFormRamSticks(value); break
      case "gpuModel": setFormGpuModel(value); break
      case "vramSize": setFormVramSize(value); break
      case "vramType": setFormVramType(value); break
    }
  }

  const handleEdit = (repair: Repair) => {
    setFormClientId(repair.clientId)
    setFormBrand(repair.brand); setFormModel(repair.model)
    setFormStorageType(repair.storageType); setFormStorageCapacity(repair.storageCapacity)
    setFormRamType(repair.ramType); setFormRamSize(repair.ramSize)
    setFormRamSticks(repair.ramSticks || ""); setFormGpuModel(repair.gpuModel || "")
    setFormVramSize(repair.vramSize || ""); setFormVramType(repair.vramType || "")
    setFormFault(repair.faultDescription); setFormPrice(repair.proposedPrice.toString())
    setFormNotes(repair.notes); setFormStatus(repair.status)
    setFormRepairDate(repair.repairDate ? new Date(repair.repairDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setEditMode(true); setSelectedRepair(repair); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formClientId || !formBrand || !formModel || !formFault) {
      toast.error("Complete los campos requeridos")
      return
    }
    setSubmitting(true)
    try {
      if (editMode && selectedRepair) {
        const res = await fetch(`/api/repairs/${selectedRepair.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: formClientId, brand: formBrand, model: formModel,
            storageType: formStorageType, storageCapacity: formStorageCapacity,
            ramType: formRamType, ramSize: formRamSize,
            ramSticks: formRamSticks, gpuModel: formGpuModel, vramSize: formVramSize, vramType: formVramType,
            faultDescription: formFault, proposedPrice: parseFloat(formPrice) || 0,
            status: formStatus, notes: formNotes, repairDate: formRepairDate,
          }),
        })
        if (res.ok) {
          toast.success("Reparación actualizada")
          setShowForm(false); resetForm(); refreshRepairs()
        }
      } else {
        const res = await fetch("/api/repairs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: formClientId, brand: formBrand, model: formModel,
            storageType: formStorageType, storageCapacity: formStorageCapacity,
            ramType: formRamType, ramSize: formRamSize,
            ramSticks: formRamSticks, gpuModel: formGpuModel, vramSize: formVramSize, vramType: formVramType,
            faultDescription: formFault, proposedPrice: parseFloat(formPrice) || 0,
            notes: formNotes, repairDate: formRepairDate,
          }),
        })
        if (res.ok) {
          toast.success("Reparación registrada")
          setShowForm(false); resetForm(); refreshRepairs()
        }
      }
    } catch {
      toast.error("Error al guardar")
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar reparación?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    })
    if (result.isConfirmed) {
      await fetch(`/api/repairs/${id}`, { method: "DELETE" })
      toast.success("Reparación eliminada")
      setSelectedRepair(null); refreshRepairs()
    }
  }

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "pending": return <Clock className="w-4 h-4" />
      case "in_progress": return <Wrench className="w-4 h-4" />
      case "completed": return <CheckCircle2 className="w-4 h-4" />
      case "delivered": return <Truck className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const isWarrantyActive = (warrantyExpires: string | null) => {
    if (!warrantyExpires) return false
    return new Date(warrantyExpires) > new Date()
  }

  if (loading) return <div className="p-6 space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}</div>

  return (
    <div className="flex h-full">
      {/* List Panel */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-brand" /> Reparaciones
              </h1>
              <p className="text-xs text-muted-foreground">Garantía: 3 meses desde la fecha de reparación</p>
            </div>
            {isAuthenticated && (
              <Button onClick={() => { resetForm(); setEditMode(false); setShowForm(true) }} className="gap-1">
                Nueva
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="delivered">Entregadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-1.5">
            {["pending","in_progress","completed","delivered"].map(s => {
              const count = repairs.filter(r => r.status === s).length
              return (
                <button key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    filterStatus === s ? STATUS_COLORS[s] : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getStatusIcon(s)} {STATUS_LABELS[s]} ({count})
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay reparaciones</p>
            </CardContent></Card>
          ) : filtered.map(repair => (
            <Card key={repair.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedRepair?.id === repair.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedRepair(repair)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{repair.brand} {repair.model}</p>
                      {repair.warrantyExpires && isWarrantyActive(repair.warrantyExpires) && (
                        <Shield className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{repair.client?.name} · {repair.client?.mobile}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{repair.faultDescription}</p>
                    {repair.storageType || repair.ramType ? (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {repair.storageType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{repair.storageType} {repair.storageCapacity}</span>}
                        {repair.ramType && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{repair.ramType} {repair.ramSize}</span>}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[repair.status]}`}>
                      {STATUS_LABELS[repair.status]}
                    </Badge>
                    <span className="text-sm font-bold text-success">${repair.proposedPrice.toFixed(0)}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="w-[340px] lg:w-[420px] shrink-0 overflow-y-auto">
        {selectedRepair ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{selectedRepair.brand} {selectedRepair.model}</h2>
              {isAuthenticated && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => {
                    onRequestEdit(selectedRepair.id, `${selectedRepair.brand} ${selectedRepair.model}`, () => handleEdit(selectedRepair))
                  }}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    onRequestEdit(selectedRepair.id, `${selectedRepair.brand} ${selectedRepair.model}`, () => handleDelete(selectedRepair.id))
                  }}>
                    Eliminar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Badge variant="outline" className={`${STATUS_COLORS[selectedRepair.status]} px-3 py-1`}>
                {getStatusIcon(selectedRepair.status)} <span className="ml-1">{STATUS_LABELS[selectedRepair.status]}</span>
              </Badge>
              <span className="text-xl font-bold text-success">${selectedRepair.proposedPrice.toFixed(2)}</span>
            </div>

            {/* Warranty */}
            <Card className={selectedRepair.warrantyExpires && isWarrantyActive(selectedRepair.warrantyExpires) ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className={`w-4 h-4 ${selectedRepair.warrantyExpires && isWarrantyActive(selectedRepair.warrantyExpires) ? 'text-success' : 'text-warning'}`} />
                  <span className="text-xs font-semibold">
                    {selectedRepair.warrantyExpires && isWarrantyActive(selectedRepair.warrantyExpires) ? "Garantía Vigente" : "Garantía Vencida"}
                  </span>
                </div>
                <div className="text-xs space-y-0.5">
                  <p><span className="text-muted-foreground">Fecha reparación:</span> {new Date(selectedRepair.repairDate).toLocaleDateString("es-ES")}</p>
                  <p><span className="text-muted-foreground">Vencimiento (3 meses):</span> {selectedRepair.warrantyExpires ? new Date(selectedRepair.warrantyExpires).toLocaleDateString("es-ES") : "—"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">CLIENTE</h4>
                <p className="font-medium">{selectedRepair.client?.name}</p>
                <p className="text-xs text-muted-foreground">{selectedRepair.client?.mobile} {selectedRepair.client?.address ? `· ${selectedRepair.client.address}` : ""}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">EQUIPO</h4>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <p><span className="text-muted-foreground">Marca:</span> {selectedRepair.brand}</p>
                  <p><span className="text-muted-foreground">Modelo:</span> {selectedRepair.model}</p>
                  <p><span className="text-muted-foreground">Disco:</span> {selectedRepair.storageType || "—"} {selectedRepair.storageCapacity}</p>
                  <p><span className="text-muted-foreground">RAM:</span> {selectedRepair.ramType || "—"} {selectedRepair.ramSize}{selectedRepair.ramSticks ? ` (${selectedRepair.ramSticks})` : ""}</p>
                  {selectedRepair.gpuModel && <p><span className="text-muted-foreground">GPU:</span> {selectedRepair.gpuModel}{selectedRepair.vramSize ? ` ${selectedRepair.vramSize}` : ""}{selectedRepair.vramType ? ` ${selectedRepair.vramType}` : ""}</p>}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">DESCRIPCIÓN DE FALLA</h4>
                <p>{selectedRepair.faultDescription}</p>
              </div>
              {selectedRepair.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">NOTAS</h4>
                  <p>{selectedRepair.notes}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                Creada: {new Date(selectedRepair.createdAt).toLocaleString("es-ES")}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Wrench className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Seleccione una reparación</p>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {isAuthenticated && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar Reparación" : "Nueva Reparación"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ClientSelectCreate value={formClientId} onChange={setFormClientId} />

              <DeviceSpecsSelector
                brand={formBrand} model={formModel}
                storageType={formStorageType} storageCapacity={formStorageCapacity}
                ramType={formRamType} ramSize={formRamSize}
                ramSticks={formRamSticks} gpuModel={formGpuModel} vramSize={formVramSize} vramType={formVramType}
                onChange={handleSpecChange}
                advancedSpecsEnabled={canUseAdvancedSpecs}
              />

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción de la Falla *</Label>
                <Textarea placeholder="Describa el problema..." value={formFault} onChange={e => setFormFault(e.target.value)} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio Propuesto ($)</Label>
                  <Input type="number" placeholder="0.00" value={formPrice} onChange={e => setFormPrice(e.target.value)} step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha de Reparación</Label>
                  <Input type="date" value={formRepairDate} onChange={e => setFormRepairDate(e.target.value)} />
                </div>
              </div>

              {editMode && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="delivered">Entregada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Notas</Label>
                <Textarea placeholder="Observaciones..." value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
              </div>

              <div className="bg-muted/50 rounded-lg p-3 text-xs">
                <p className="font-semibold text-muted-foreground mb-1">INFO DE GARANTÍA</p>
                <p>Las reparaciones tienen una garantía de <strong>3 meses</strong> desde la fecha de reparación.</p>
                <p className="text-muted-foreground mt-1">
                  Vencimiento: {formRepairDate ? new Date(new Date(formRepairDate).setMonth(new Date(formRepairDate).getMonth() + 3)).toLocaleDateString("es-ES") : "—"}
                </p>
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : editMode ? "Guardar Cambios" : "Crear Reparación"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
