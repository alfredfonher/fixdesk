"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, Lock, Eye, EyeOff, LogIn, Loader2 } from "lucide-react"

export function LoginDialog() {
  const { users, login, isAuthenticated } = useAuth()
  const [manualSelectedUserId, setManualSelectedUserId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Auto-select if only one user; otherwise use manual selection
  const selectedUserId = users.length === 1 ? users[0].id : manualSelectedUserId
  const setSelectedUserId = users.length === 1 ? () => {} : setManualSelectedUserId

  const selectedUser = users.find(u => u.id === selectedUserId)

  const handleLogin = async () => {
    if (!selectedUserId || !password) {
      setError("Seleccione un usuario e introduzca la contraseña")
      return
    }

    if (!selectedUser) {
      setError("Usuario no encontrado")
      return
    }

    setLoading(true)
    setError("")

    const success = await login(selectedUser.username, password)

    if (!success) {
      setError("Contraseña incorrecta")
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  if (isAuthenticated) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-2">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-brand-foreground" />
            </div>
            <h1 className="text-2xl font-bold">TechFix Pro</h1>
            <p className="text-sm text-muted-foreground mt-1">Taller de Reparación de Laptops</p>
          </div>

          {/* Lock Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-warning" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mb-6">
            Introduzca sus credenciales para acceder al sistema
          </p>

          <div className="space-y-4">
            {/* User Selection */}
            {users.length > 1 ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Usuario</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.displayName || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : users.length === 1 ? (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium">{users[0].displayName || users[0].username}</p>
                <p className="text-[10px] text-muted-foreground">Usuario predeterminado</p>
              </div>
            ) : null}

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Introduzca la contraseña"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError("") }}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                  autoFocus={users.length <= 1}
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

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            {/* Login Button */}
            <Button
              className="w-full gap-2"
              onClick={handleLogin}
              disabled={loading || !selectedUserId || !password}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              ) : (
                <><LogIn className="w-4 h-4" /> Iniciar Sesión</>
              )}
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  )
}
