"use client"

import { useState, useEffect, useCallback } from "react"
import { Client } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface ClientSelectCreateProps {
  value: string
  onChange: (clientId: string) => void
  label?: string
}

export function ClientSelectCreate({ value, onChange, label = "Cliente *" }: ClientSelectCreateProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [mode, setMode] = useState<"select" | "create">("select")

  // New client fields
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newMobile, setNewMobile] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  useEffect(() => {
    if (clients.length === 0 && !loading) {
      setMode("create")
    }
  }, [clients.length, loading])

  const handleCreate = async () => {
    if (!newName.trim() || !newMobile.trim()) {
      toast.error("Nombre y móvil son requeridos")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim(),
          mobile: newMobile.trim(),
          email: newEmail.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al crear cliente")
        return
      }
      const created: Client = await res.json()
      setClients((prev) => [created, ...prev])
      onChange(created.id)
      setNewName(""); setNewAddress(""); setNewMobile(""); setNewEmail("")
      setMode("select")
      toast.success("Cliente creado")
    } catch {
      toast.error("Error al crear cliente")
    } finally {
      setCreating(false)
    }
  }

  const toggleMode = () => {
    if (mode === "select") {
      setMode("create")
    } else {
      setMode("select")
      setNewName(""); setNewAddress(""); setNewMobile(""); setNewEmail("")
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {clients.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={toggleMode}>
            {mode === "select" ? "+ Nuevo" : "← Existente"}
          </Button>
        )}
      </div>

      {mode === "select" ? (
        <Select value={value} onValueChange={onChange} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar cliente"} />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name} · {c.mobile}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2 p-2.5 border rounded-lg bg-muted/30">
          <div className="space-y-1">
            <Label className="text-[11px]">Nombre *</Label>
            <Input placeholder="Nombre completo" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Móvil *</Label>
            <Input placeholder="Número de móvil" value={newMobile} onChange={(e) => setNewMobile(e.target.value)} className="h-8 text-sm" type="tel" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Dirección</Label>
            <Input placeholder="Dirección" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Email</Label>
            <Input placeholder="correo@ejemplo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-8 text-sm" type="email" />
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={handleCreate} disabled={creating}>
            {creating ? "Creando..." : "Crear Cliente"}
          </Button>
        </div>
      )}
    </div>
  )
}
