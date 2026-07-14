"use client"

import { useState, useEffect, useCallback } from "react"
import { RepairOrder, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Laptop,
  Wrench,
  Filter,
  ChevronRight,
  Clock,
  CheckCircle2,
  Truck,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

export function RepairsList() {
  const [repairs, setRepairs] = useState<RepairOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedRepair, setSelectedRepair] = useState<RepairOrder | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const fetchRepairs = useCallback(async () => {
    try {
      const res = await fetch("/api/repairs")
      const data = await res.json()
      setRepairs(data)
    } catch (error) {
      console.error("Error fetching repairs:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRepairs()
  }, [fetchRepairs])

  const filtered = repairs.filter((r) => {
    const matchesSearch =
      !search ||
      r.brand?.toLowerCase().includes(search.toLowerCase()) ||
      r.model?.toLowerCase().includes(search.toLowerCase()) ||
      r.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.faultDescription?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filterStatus === "all" || r.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleViewRepair = (repair: RepairOrder) => {
    setSelectedRepair(repair)
    setEditStatus(repair.status)
    setEditPrice(repair.proposedPrice.toString())
    setEditNotes(repair.notes)
    setEditMode(false)
  }

  const handleUpdateRepair = async () => {
    if (!selectedRepair) return
    try {
      const res = await fetch(`/api/repairs/${selectedRepair.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          proposedPrice: parseFloat(editPrice) || 0,
          notes: editNotes,
        }),
      })
      if (res.ok) {
        toast.success("Reparación actualizada")
        setEditMode(false)
        fetchRepairs()
        const updated = await res.json()
        setSelectedRepair(updated)
      }
    } catch {
      toast.error("Error al actualizar")
    }
  }

  const handleDeleteRepair = async (id: string) => {
    if (!confirm("¿Eliminar esta orden de reparación?")) return
    try {
      await fetch(`/api/repairs/${id}`, { method: "DELETE" })
      toast.success("Reparación eliminada")
      setSelectedRepair(null)
      fetchRepairs()
    } catch {
      toast.error("Error al eliminar")
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3.5 h-3.5" />
      case "in_progress": return <Wrench className="w-3.5 h-3.5" />
      case "completed": return <CheckCircle2 className="w-3.5 h-3.5" />
      case "delivered": return <Truck className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 pb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
          <Laptop className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Reparaciones</h1>
          <p className="text-xs text-muted-foreground">{repairs.length} órdenes registradas</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar reparación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-10">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="in_progress">En Progreso</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="delivered">Entregadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Quick Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["pending", "in_progress", "completed", "delivered"].map((s) => {
          const count = repairs.filter((r) => r.status === s).length
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                filterStatus === s
                  ? STATUS_COLORS[s]
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {getStatusIcon(s)}
              {STATUS_LABELS[s]} ({count})
            </button>
          )
        })}
      </div>

      {/* Repairs List */}
      {filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center">
            <Laptop className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search || filterStatus !== "all"
                ? "No se encontraron reparaciones"
                : "No hay reparaciones registradas"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((repair) => (
            <Card
              key={repair.id}
              className="shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              onClick={() => handleViewRepair(repair)}
            >
              <CardContent className="p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">
                        {repair.brand} {repair.model}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {repair.client?.name} · {repair.client?.mobile}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {repair.faultDescription}
                    </p>
                    {repair.storageType || repair.ramType ? (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {repair.storageType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                            {repair.storageType} {repair.storageCapacity}
                          </span>
                        )}
                        {repair.ramType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">
                            {repair.ramType} {repair.ramSize}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[repair.status] || ""}`}
                    >
                      {STATUS_LABELS[repair.status] || repair.status}
                    </Badge>
                    <span className="text-sm font-bold text-emerald-600">
                      ${repair.proposedPrice.toFixed(0)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Repair Detail Dialog */}
      <Dialog open={!!selectedRepair} onOpenChange={(open) => !open && setSelectedRepair(null)}>
        <DialogContent className="max-w-[calc(100vw-32px)] max-h-[85vh] overflow-y-auto">
          {selectedRepair && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Laptop className="w-5 h-5" />
                  {selectedRepair.brand} {selectedRepair.model}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className={`${STATUS_COLORS[selectedRepair.status]} px-3 py-1`}
                  >
                    {getStatusIcon(selectedRepair.status)}
                    <span className="ml-1">{STATUS_LABELS[selectedRepair.status]}</span>
                  </Badge>
                  <span className="text-lg font-bold text-emerald-600">
                    ${selectedRepair.proposedPrice.toFixed(2)}
                  </span>
                </div>

                <Separator />

                {/* Client Info */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">CLIENTE</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Nombre</span>
                      <p className="font-medium">{selectedRepair.client?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Móvil</span>
                      <p className="font-medium">{selectedRepair.client?.mobile}</p>
                    </div>
                    {selectedRepair.client?.address && (
                      <div className="col-span-2">
                        <span className="text-xs text-muted-foreground">Dirección</span>
                        <p className="font-medium">{selectedRepair.client.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Device Specs */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">EQUIPO</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Marca</span>
                      <p className="font-medium">{selectedRepair.brand}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Modelo</span>
                      <p className="font-medium">{selectedRepair.model}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Almacenamiento</span>
                      <p className="font-medium">
                        {selectedRepair.storageType || "—"} {selectedRepair.storageCapacity}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">RAM</span>
                      <p className="font-medium">
                        {selectedRepair.ramType || "—"} {selectedRepair.ramSize}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fault */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">DESCRIPCIÓN DE FALLA</h4>
                  <p className="text-sm">{selectedRepair.faultDescription}</p>
                </div>

                {selectedRepair.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">NOTAS</h4>
                    <p className="text-sm">{selectedRepair.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Edit Section */}
                {editMode ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Estado</Label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="delivered">Entregada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Precio ($)</Label>
                      <Input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notas</Label>
                      <Textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={handleUpdateRepair}
                      >
                        Guardar Cambios
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditMode(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteRepair(selectedRepair.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground text-center">
                  Creada: {new Date(selectedRepair.createdAt).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
