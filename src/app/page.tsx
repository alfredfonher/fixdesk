"use client"

import { useState, useEffect } from "react";
import { useFirstRun } from "@/hooks/useFirstRun";
import { AuthProvider, useAuth } from "@/components/auth-provider";
import { FirstRunWizard } from "@/components/first-run-wizard";

import { AppInfoDialog } from "@/components/app-info-dialog";
import { ReAuthDialog } from "@/components/re-auth-dialog"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { RepairsView } from "@/components/repairs-view"
import { ClientsView } from "@/components/clients-view"
import { ChatView } from "@/components/chat-view"
import { APP_METADATA, getAppDisplayVersion } from "@/lib/app-metadata"
import {
  Wrench, Users, Bot,
  ChevronLeft, ChevronRight, Lock, LogOut,
  KeyRound, UserCog, Clock, Info,
} from "lucide-react"
import Swal from "sweetalert2"

type View = "repairs" | "clients" | "chat"

const navItems: { id: View; label: string; icon: React.ReactNode; group: string }[] = [
  { id: "repairs", label: "Reparaciones", icon: <Wrench className="w-5 h-5" />, group: "Principal" },
  { id: "clients", label: "Clientes", icon: <Users className="w-5 h-5" />, group: "Principal" },
  { id: "chat", label: "Asistente IA", icon: <Bot className="w-5 h-5" />, group: "Herramientas" },
]

function AppContent() {
  const { isAuthenticated, user, login, logout, authorizeRecord, isEditAuthorized, clearAllAuthorizations, lastActivity, resetInactivity } = useAuth();
  const { completed, hasUsers, loading: firstRunLoading, fetchFlag } = useFirstRun();

  const [activeView, setActiveView] = useState<View>("repairs")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showAppInfo, setShowAppInfo] = useState(false)
  const [reAuthRecordId, setReAuthRecordId] = useState<string | null>(null)
  const [reAuthRecordName, setReAuthRecordName] = useState<string>("")
  const [reAuthCallback, setReAuthCallback] = useState<(() => void) | null>(null)
  // Time remaining before inactivity lock
  const [timeRemaining, setTimeRemaining] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      setShowUserManagement(false)
      setReAuthRecordId(null)
      setReAuthRecordName("")
      setReAuthCallback(null)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity
      const remaining = Math.max(0, 15 * 60 * 1000 - elapsed)
      if (remaining <= 0) {
        setTimeRemaining("Bloqueado")
      } else {
        const mins = Math.floor(remaining / 60000)
        const secs = Math.floor((remaining % 60000) / 1000)
        setTimeRemaining(`${mins}:${secs.toString().padStart(2, "0")}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, lastActivity])

  const handleAdminLogin = async () => {
    const result = await Swal.fire({
      title: "Acceso de administrador",
      html: `
        <p style="margin: 0 0 1rem; font-size: 0.875rem; color: inherit;">
          El dashboard sigue público y en modo solo lectura.
        </p>
        <input id="admin-username" class="swal2-input" placeholder="Usuario" autocomplete="username" />
        <input id="admin-password" type="password" class="swal2-input" placeholder="Contraseña" autocomplete="current-password" />
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Entrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0f766e",
      preConfirm: async () => {
        const popup = Swal.getPopup()
        const username = (popup?.querySelector("#admin-username") as HTMLInputElement | null)?.value.trim() ?? ""
        const password = (popup?.querySelector("#admin-password") as HTMLInputElement | null)?.value ?? ""

        if (!username || !password) {
          Swal.showValidationMessage("Ingrese usuario y contraseña")
          return false
        }

        const success = await login(username, password)
        if (!success) {
          Swal.showValidationMessage("Credenciales inválidas")
          return false
        }

        return true
      },
      didOpen: () => {
        const popup = Swal.getPopup()
        const usernameInput = popup?.querySelector<HTMLInputElement>("#admin-username")
        usernameInput?.focus()
      },
    })

    if (result.isConfirmed) {
      await Swal.fire({
        icon: "success",
        title: "Sesión iniciada",
        timer: 1200,
        showConfirmButton: false,
      })
    }
  }

  // Request edit with re-auth
  const requestEdit = (recordId: string, recordName: string, callback: () => void) => {
    if (!isAuthenticated) {
      return // Login dialog will show
    }
    if (isEditAuthorized(recordId)) {
      callback()
      return
    }
    // Show re-auth dialog
    setReAuthRecordId(recordId)
    setReAuthRecordName(recordName)
    setReAuthCallback(() => callback)
  }

  const handleReAuthSuccess = () => {
    if (reAuthRecordId) {
      // Mark this record as authorized in the auth context
      authorizeRecord(reAuthRecordId)
      // Execute the pending callback
      if (reAuthCallback) {
        reAuthCallback()
      }
    }
    setReAuthRecordId(null)
    setReAuthRecordName("")
    setReAuthCallback(null)
  }

  // Clear edit authorization when switching views or records
  const clearEdit = () => {
    clearAllAuthorizations()
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Tendrá que autenticarse nuevamente para hacer cambios",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f766e",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
    })
    if (result.isConfirmed) {
      await logout()
    }
  }

  const renderView = () => {
    switch (activeView) {
      case "repairs": return <RepairsView isAuthenticated={isAuthenticated} onRequestEdit={requestEdit} editingRecordId={null} clearEdit={clearEdit} />
      case "clients": return <ClientsView isAuthenticated={isAuthenticated} onRequestEdit={requestEdit} editingRecordId={null} clearEdit={clearEdit} />
      case "chat": return <ChatView />
    }
  }

  const visibleNavItems = navItems

  const groupedNav = visibleNavItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {})

  return (
    <div className="h-screen flex bg-background">
      <FirstRunWizard
        open={!firstRunLoading && (hasUsers === false || completed === false)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            void fetchFlag()
          }
        }}
      />
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-56"} flex flex-col border-r bg-card transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-12 flex items-center gap-2 px-3 border-b">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-brand-foreground" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">TechFix Pro</h1>
              <p className="text-[10px] text-muted-foreground truncate">Taller de Laptops</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
          {Object.entries(groupedNav).map(([group, items]) => (
            <div key={group}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                      activeView === item.id
                        ? "bg-brand text-brand-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {!sidebarCollapsed && item.id === "chat" && (
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 ml-auto">IA</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Controls */}
        <div className="border-t p-2 space-y-1">
          {/* Auth Status */}
          {isAuthenticated && user && !sidebarCollapsed && (
            <div className="px-2 py-1.5 mb-1 rounded-md bg-success/10">
              <div className="flex items-center gap-1.5 text-sm">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="font-medium truncate">{user.displayName || user.username}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>Sesión: {timeRemaining}</span>
              </div>
            </div>
          )}

          {!isAuthenticated && !sidebarCollapsed && (
            <div className="px-2 py-1.5 mb-1 rounded-md bg-warning/10">
              <div className="flex items-center gap-1.5 text-sm">
                <Lock className="w-3 h-3 text-warning" />
                <span className="font-medium text-warning-foreground">Solo lectura</span>
              </div>
            </div>
          )}

          {!isAuthenticated && hasUsers !== false && (
            <button
              onClick={handleAdminLogin}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Acceso de administrador"
            >
              <KeyRound className="w-4 h-4" />
              {!sidebarCollapsed && <span>Acceso admin</span>}
            </button>
          )}

          {/* User Management */}
          {isAuthenticated && (
            <button
              onClick={() => setShowUserManagement(true)}
               className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Gestión de Usuarios"
            >
              <UserCog className="w-4 h-4" />
              {!sidebarCollapsed && <span>Usuarios</span>}
            </button>
          )}

          {/* Logout */}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
               className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
              {!sidebarCollapsed && <span>Cerrar Sesión</span>}
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={() => setActiveView("settings")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base transition-colors ${
                activeView === "settings"
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              title="Apariencia"
            >
              <Settings className="w-4 h-4" />
              {!sidebarCollapsed && <span>Apariencia</span>}
            </button>
          )}

          <button
            onClick={() => setShowAppInfo(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Información de la app"
          >
            <Info className="w-4 h-4" />
            {!sidebarCollapsed && <span>Información</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
              <p className="font-medium text-foreground">{getAppDisplayVersion()} · {APP_METADATA.releaseType}</p>
            </div>
          )}

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-base text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!sidebarCollapsed && <span>Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden relative">
        {renderView()}
      </main>

      {/* Re-Auth Dialog */}
      {reAuthRecordId && (
        <ReAuthDialog
          open={!!reAuthRecordId}
          onOpenChange={(open) => {
            if (!open) {
              setReAuthRecordId(null)
              setReAuthRecordName("")
              setReAuthCallback(null)
            }
          }}
          recordId={reAuthRecordId}
          recordName={reAuthRecordName}
          onAuthorized={handleReAuthSuccess}
        />
      )}

      {/* User Management Dialog */}
      <UserManagementDialog open={showUserManagement} onOpenChange={setShowUserManagement} />

      {/* App Info Dialog */}
      <AppInfoDialog open={showAppInfo} onOpenChange={setShowAppInfo} />
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
