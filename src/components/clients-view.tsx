"use client"

import { useState, useEffect, useRef } from "react"
import { Client } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Users, Phone, MapPin, Mail, ChevronRight, MessageCircle, Copy } from "lucide-react"
import { toast } from "sonner"
import Swal from "sweetalert2"

interface ClientsViewProps {
  isAuthenticated: boolean
  onRequestEdit: (recordId: string, recordName: string, callback: () => void) => void
  editingRecordId: string | null
  clearEdit: () => void
  canUseWhatsApp?: boolean
  onBlockedFeature?: (featureLabel: string) => void
}

export function ClientsView({ isAuthenticated, onRequestEdit, editingRecordId, clearEdit, canUseWhatsApp = true, onBlockedFeature }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [mobile, setMobile] = useState("")
  const [email, setEmail] = useState("")

  const prevSelectedClientRef = useRef<Client | null>(null)

  // When selectedClient changes to a different item, call clearEdit()
  useEffect(() => {
    if (prevSelectedClientRef.current !== null && selectedClient !== null && prevSelectedClientRef.current.id !== selectedClient.id) {
      clearEdit()
    }
    prevSelectedClientRef.current = selectedClient
  }, [selectedClient, clearEdit])

  const refreshClients = async () => {
    try { const res = await fetch("/api/clients"); setClients(await res.json()) }
    catch {}
  }

  useEffect(() => {
    const fetchClients = async () => {
      try { const res = await fetch("/api/clients"); setClients(await res.json()) }
      catch {} finally { setLoading(false) }
    }

    fetchClients()
  }, [])

  const filtered = clients.filter(c => !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => { setName(""); setAddress(""); setMobile(""); setEmail(""); setEditMode(false) }

  const openEdit = (client: Client) => {
    setEditMode(true); setName(client.name); setAddress(client.address)
    setMobile(client.mobile); setEmail(client.email); setSelectedClient(client); setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!name || !mobile) { toast.error("Nombre y móvil son requeridos"); return }
    try {
      if (editMode && selectedClient) {
        await fetch(`/api/clients/${selectedClient.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, mobile, email }),
        })
        toast.success("Cliente actualizado")
      } else {
        await fetch("/api/clients", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, mobile, email }),
        })
        toast.success("Cliente registrado")
      }
      setShowForm(false); resetForm(); refreshClients()
    } catch { toast.error("Error al guardar") }
  }

  const handleCopyPhone = async () => {
    if (!selectedClient?.mobile) return
    const text = selectedClient.mobile
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement("textarea")
        ta.value = text
        ta.setAttribute("readonly", "")
        ta.style.position = "fixed"
        ta.style.top = "0"
        ta.style.left = "0"
        ta.style.opacity = "0"
        ta.style.pointerEvents = "none"
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        if (!ok) throw new Error("copy command rejected")
      }
      toast.success("Número copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el número")
    }
  }

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "¿Eliminar cliente?", text: "Se eliminarán también todas sus reparaciones, compras y ventas",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar",
    })
    if (result.isConfirmed) {
      await fetch(`/api/clients/${id}`, { method: "DELETE" })
      toast.success("Cliente eliminado"); setSelectedClient(null); refreshClients()
    }
  }

  if (loading) return <div className="p-6 space-y-3">{[1,2,3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-14 bg-muted rounded" /></CardContent></Card>)}</div>

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex-1 flex flex-col min-w-0 border-r">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" /> Clientes
            </h1>
            {isAuthenticated && (
              <Button onClick={() => { resetForm(); setEditMode(false); setShowForm(true) }} className="gap-1">
                Nuevo
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay clientes</p>
            </CardContent></Card>
          ) : filtered.map(client => (
            <Card key={client.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedClient?.id === client.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedClient(client)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {client.mobile}
                      </span>
                      {client._count && (
                        <div className="flex gap-1">
                          {client._count.repairs > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0">{client._count.repairs} rep</Badge>}
                          {client._count.purchases > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0">{client._count.purchases} comp</Badge>}
                          {client._count.sales > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0">{client._count.sales} vent</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="w-[340px] lg:w-[420px] shrink-0 overflow-y-auto">
        {selectedClient ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{selectedClient.name}</h2>
              {isAuthenticated && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => {
                    onRequestEdit(selectedClient.id, selectedClient.name, () => openEdit(selectedClient))
                  }}>
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    onRequestEdit(selectedClient.id, selectedClient.name, () => handleDelete(selectedClient.id))
                  }}>
                    Eliminar
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /> {selectedClient.mobile}</div>
              {selectedClient.address && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" /> {selectedClient.address}</div>}
              {selectedClient.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /> {selectedClient.email}</div>}
            </div>

            {selectedClient.mobile && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopyPhone}
                >
                  <Copy className="w-4 h-4" />
                  Copiar número
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-success border-success/30 hover:bg-success/10 hover:text-success"
                  onClick={() => {
                    if (!canUseWhatsApp) {
                      onBlockedFeature?.("WhatsApp")
                      return
                    }

                    const cleaned = selectedClient.mobile.replace(/[^0-9+]/g, "")
                    const num = cleaned.startsWith("+") ? cleaned : `+53${cleaned}`
                    window.open(`https://wa.me/${num.replace("+", "")}`, "_blank")
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            )}

            {selectedClient._count && (
              <div className="grid grid-cols-3 gap-2">
                <Card><CardContent className="p-2 text-center">
                  <p className="text-lg font-bold">{selectedClient._count.repairs}</p>
                  <p className="text-[10px] text-muted-foreground">Reparaciones</p>
                </CardContent></Card>
                <Card><CardContent className="p-2 text-center">
                  <p className="text-lg font-bold">{selectedClient._count.purchases}</p>
                  <p className="text-[10px] text-muted-foreground">Compras</p>
                </CardContent></Card>
                <Card><CardContent className="p-2 text-center">
                  <p className="text-lg font-bold">{selectedClient._count.sales}</p>
                  <p className="text-[10px] text-muted-foreground">Ventas</p>
                </CardContent></Card>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Registrado: {new Date(selectedClient.createdAt).toLocaleString("es-ES")}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Seleccione un cliente</p>
            </div>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      {isAuthenticated && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label className="text-xs">Nombre *</Label><Input placeholder="Nombre completo" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Móvil *</Label><Input placeholder="Número de móvil" value={mobile} onChange={e => setMobile(e.target.value)} type="tel" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Dirección</Label><Input placeholder="Dirección" value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input placeholder="correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
              <Button className="w-full" onClick={handleSubmit}>{editMode ? "Guardar Cambios" : "Registrar Cliente"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
