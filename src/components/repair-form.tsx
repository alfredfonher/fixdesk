"use client"

import { useState, useEffect, useCallback } from "react"
import { Client, RepairOrder, STORAGE_TYPES, STORAGE_CAPACITIES, RAM_TYPES, RAM_SIZES, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Laptop, ChevronRight, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"

export function RepairForm({ onSuccess }: { onSuccess?: () => void }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)

  // Client fields
  const [selectedClientId, setSelectedClientId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientMobile, setClientMobile] = useState("")
  const [clientEmail, setClientEmail] = useState("")

  // Device fields
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [storageType, setStorageType] = useState("")
  const [storageCapacity, setStorageCapacity] = useState("")
  const [ramType, setRamType] = useState("")
  const [ramSize, setRamSize] = useState("")

  // Repair fields
  const [faultDescription, setFaultDescription] = useState("")
  const [proposedPrice, setProposedPrice] = useState("")
  const [notes, setNotes] = useState("")

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSelectClient = (id: string) => {
    const client = clients.find((c) => c.id === id)
    if (client) {
      setSelectedClientId(id)
      setClientName(client.name)
      setClientAddress(client.address)
      setClientMobile(client.mobile)
      setClientEmail(client.email)
    }
  }

  const handleNewClient = () => {
    setSelectedClientId("")
    setClientName("")
    setClientAddress("")
    setClientMobile("")
    setClientEmail("")
    setShowNewClient(true)
  }

  const handleSubmit = async () => {
    if (!clientName || !clientMobile) {
      toast.error("Nombre y móvil del cliente son requeridos")
      return
    }
    if (!brand || !model) {
      toast.error("Marca y modelo del equipo son requeridos")
      return
    }
    if (!faultDescription) {
      toast.error("La descripción de la falla es requerida")
      return
    }

    setLoading(true)
    try {
      let clientId = selectedClientId

      // Create client if new
      if (!clientId) {
        const clientRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: clientName,
            address: clientAddress,
            mobile: clientMobile,
            email: clientEmail,
          }),
        })
        const clientData = await clientRes.json()
        if (!clientRes.ok) {
          toast.error(clientData.error || "Error al crear cliente")
          return
        }
        clientId = clientData.id
      }

      // Create repair order
      const repairRes = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          brand,
          model,
          storageType,
          storageCapacity,
          ramType,
          ramSize,
          faultDescription,
          proposedPrice: parseFloat(proposedPrice) || 0,
          status: "pending",
          notes,
        }),
      })

      if (!repairRes.ok) {
        const data = await repairRes.json()
        toast.error(data.error || "Error al crear reparación")
        return
      }

      toast.success("¡Orden de reparación creada exitosamente!")
      
      // Reset form
      setSelectedClientId("")
      setClientName("")
      setClientAddress("")
      setClientMobile("")
      setClientEmail("")
      setBrand("")
      setModel("")
      setStorageType("")
      setStorageCapacity("")
      setRamType("")
      setRamSize("")
      setFaultDescription("")
      setProposedPrice("")
      setNotes("")
      setShowNewClient(false)
      
      fetchClients()
      onSuccess?.()
    } catch (error) {
      toast.error("Error al guardar la información")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4 pb-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Nueva Reparación</h1>
          <p className="text-xs text-muted-foreground">Registrar orden de reparación</p>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-4 pr-2">
          {/* Client Section */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">1</span>
                  Datos del Cliente
                </h3>
                {clients.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleNewClient}
                  >
                    {showNewClient ? "Cliente existente" : "Nuevo cliente"}
                  </Button>
                )}
              </div>

              {!showNewClient && clients.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs">Seleccionar Cliente</Label>
                  <Select value={selectedClientId} onValueChange={handleSelectClient}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Buscar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} · {c.mobile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {(showNewClient || clients.length === 0) && (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre *</Label>
                    <Input
                      placeholder="Nombre completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dirección</Label>
                    <Input
                      placeholder="Dirección del cliente"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Móvil *</Label>
                    <Input
                      placeholder="Número de móvil"
                      value={clientMobile}
                      onChange={(e) => setClientMobile(e.target.value)}
                      className="h-10"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input
                      placeholder="correo@ejemplo.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="h-10"
                      type="email"
                    />
                  </div>
                </div>
              )}

              {selectedClientId && !showNewClient && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/50 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground">Dirección:</span>
                    <p className="font-medium">{clientAddress || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Móvil:</span>
                    <p className="font-medium">{clientMobile}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{clientEmail || "—"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Section */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">2</span>
                Datos del Equipo
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Marca *</Label>
                  <Input
                    placeholder="Dell, HP, Lenovo..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Modelo *</Label>
                  <Input
                    placeholder="Inspiron 15..."
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <Separator className="my-1" />
              <p className="text-[11px] text-muted-foreground font-medium">ESPECIFICACIONES DE ALMACENAMIENTO</p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de Disco</Label>
                  <Select value={storageType} onValueChange={setStorageType}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_TYPES.map((st) => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Capacidad</Label>
                  <Select value={storageCapacity} onValueChange={setStorageCapacity}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {STORAGE_CAPACITIES.map((sc) => (
                        <SelectItem key={sc.value} value={sc.value}>
                          {sc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-1" />
              <p className="text-[11px] text-muted-foreground font-medium">ESPECIFICACIONES DE MEMORIA RAM</p>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo de RAM</Label>
                  <Select value={ramType} onValueChange={setRamType}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAM_TYPES.map((rt) => (
                        <SelectItem key={rt.value} value={rt.value}>
                          {rt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tamaño RAM</Label>
                  <Select value={ramSize} onValueChange={setRamSize}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {RAM_SIZES.map((rs) => (
                        <SelectItem key={rs.value} value={rs.value}>
                          {rs.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Repair Section */}
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">3</span>
                Detalle de Reparación
              </h3>

              <div className="space-y-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Descripción de la Falla *</Label>
                  <Textarea
                    placeholder="Describa el problema del equipo..."
                    value={faultDescription}
                    onChange={(e) => setFaultDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Precio Propuesto ($)</Label>
                  <Input
                    placeholder="0.00"
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="h-10"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas Adicionales</Label>
                  <Textarea
                    placeholder="Observaciones adicionales..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {(brand || model || faultDescription) && (
            <Card className="shadow-sm border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold text-emerald-700 mb-2">RESUMEN</h3>
                <div className="space-y-1 text-xs">
                  <p><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{clientName || "—"}</span></p>
                  <p><span className="text-muted-foreground">Equipo:</span> <span className="font-medium">{brand} {model}</span></p>
                  <p><span className="text-muted-foreground">Almacenamiento:</span> <span className="font-medium">{storageType || "—"} {storageCapacity}</span></p>
                  <p><span className="text-muted-foreground">RAM:</span> <span className="font-medium">{ramType || "—"} {ramSize}</span></p>
                  <p><span className="text-muted-foreground">Falla:</span> <span className="font-medium">{faultDescription || "—"}</span></p>
                  <p><span className="text-muted-foreground">Precio:</span> <span className="font-bold text-emerald-700">${parseFloat(proposedPrice || "0").toFixed(2)}</span></p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Crear Orden de Reparación
              </span>
            )}
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}
