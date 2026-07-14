"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ReAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recordId: string
  recordName?: string
  onAuthorized: () => void
}

export function ReAuthDialog({ open, onOpenChange, recordId, recordName, onAuthorized }: ReAuthDialogProps) {
  const { user, login } = useAuth()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!password) {
      toast.error("Introduzca la contraseña")
      return
    }

    if (!user) {
      toast.error("No hay sesión activa")
      return
    }

    setLoading(true)

    try {
      // Re-authenticate using the login API
      const success = await login(user.username, password)
      if (success) {
        setPassword("")
        onAuthorized()
        onOpenChange(false)
        toast.success("Autenticación exitosa")
      } else {
        toast.error("Contraseña incorrecta")
      }
    } catch {
      toast.error("Error de verificación")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleVerify()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPassword(""); onOpenChange(v) }}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-warning" />
            Autenticación Requerida
          </DialogTitle>
          <DialogDescription>
            Para modificar{recordName ? ` los datos de ${recordName}` : " estos datos"}, verifique su contraseña.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Usuario actual</p>
            <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Introduzca su contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setPassword(""); onOpenChange(false) }}>
              Cancelar
            </Button>
            <Button className="flex-1 gap-2" onClick={handleVerify} disabled={loading || !password}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                "Verificar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
