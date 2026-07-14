"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KeyRound, UserPlus, Users, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UserManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserManagementDialog({ open, onOpenChange }: UserManagementDialogProps) {
  const { user, users, changePassword, createUser, updateUserRole, updateUsername } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [newUsername, setNewUsername] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserDisplayName, setNewUserDisplayName] = useState("")
  const [newUserRole, setNewUserRole] = useState("admin")
  const [creatingUser, setCreatingUser] = useState(false)
  const [usernameDrafts, setUsernameDrafts] = useState<Record<string, string>>({})
  const [savingUsernameId, setSavingUsernameId] = useState<string | null>(null)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Complete todos los campos")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden")
      return
    }
    if (newPassword.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres")
      return
    }

    setChangingPassword(true)
    const success = await changePassword(currentPassword, newPassword)
    setChangingPassword(false)

    if (success) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newUserPassword) {
      toast.error("Usuario y contraseña son requeridos")
      return
    }
    if (newUserPassword.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres")
      return
    }

    setCreatingUser(true)
    const success = await createUser(newUsername, newUserPassword, newUserDisplayName, newUserRole)
    setCreatingUser(false)

    if (success) {
      setNewUsername("")
      setNewUserPassword("")
      setNewUserDisplayName("")
      setNewUserRole("admin")
    }
  }

  const handleSaveUsername = async (userId: string, currentUsername: string) => {
    const nextUsername = (usernameDrafts[userId] ?? currentUsername).trim()

    if (!nextUsername) {
      toast.error("El nombre de usuario no puede estar vacío")
      return
    }

    if (nextUsername === currentUsername) {
      toast.info("No hay cambios para guardar")
      return
    }

    setSavingUsernameId(userId)
    const success = await updateUsername(userId, nextUsername)
    setSavingUsernameId(null)

    if (success) {
      setUsernameDrafts(prev => ({ ...prev, [userId]: nextUsername }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> Gestión de Usuarios
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="password">
          <TabsList className="w-full">
            <TabsTrigger value="password" className="flex-1 gap-1">
              <KeyRound className="w-3.5 h-3.5" /> Contraseña
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 gap-1">
              <Users className="w-3.5 h-3.5" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Nuevo
            </TabsTrigger>
          </TabsList>

          {/* Change Password */}
          <TabsContent value="password" className="space-y-3 mt-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Usuario actual</p>
              <p className="text-sm font-semibold">{user?.displayName || user?.username}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contraseña actual</Label>
              <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nueva contraseña</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirmar nueva contraseña</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <Button className="w-full gap-2" onClick={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Cambiar Contraseña
            </Button>
          </TabsContent>

          {/* Users List */}
          <TabsContent value="users" className="space-y-3 mt-4">
            <div className="space-y-2">
              {users.map(u => {
                const isCurrentUser = u.id === user?.id
                const draftUsername = usernameDrafts[u.id] ?? u.username
                const isSavingUsername = savingUsernameId === u.id
                return (
                  <div key={u.id} className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{u.displayName || u.username}</p>
                      <div className="flex items-center gap-2">
                        {isCurrentUser ? (
                          <Badge variant="default" className="text-[10px]">Actual</Badge>
                        ) : (
                          <Select value={u.role} onValueChange={(value) => updateUserRole(u.id, value)}>
                            <SelectTrigger className="w-[120px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="technician">Técnico</SelectItem>
                              <SelectItem value="viewer">Solo Lectura</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">@{u.username}</p>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre de usuario</Label>
                      <div className="flex gap-2">
                        <Input
                          value={draftUsername}
                          onChange={e => setUsernameDrafts(prev => ({ ...prev, [u.id]: e.target.value }))}
                          placeholder="usuario"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSaveUsername(u.id, u.username)}
                          disabled={isSavingUsername}
                        >
                          {isSavingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* New User */}
          <TabsContent value="new" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre de usuario *</Label>
              <Input placeholder="usuario" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contraseña *</Label>
              <Input type="password" placeholder="Mínimo 4 caracteres" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre para mostrar</Label>
              <Input placeholder="Nombre completo" value={newUserDisplayName} onChange={e => setNewUserDisplayName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Select value={newUserRole} onValueChange={setNewUserRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="technician">Técnico</SelectItem>
                  <SelectItem value="viewer">Solo Lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full gap-2" onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Crear Usuario
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
