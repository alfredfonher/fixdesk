"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

interface AuthUser {
  id: string
  username: string
  displayName: string
  role: string
}

interface UserInfo {
  id: string
  username: string
  displayName: string
  role: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  users: UserInfo[]
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  verifySession: () => Promise<boolean>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  createUser: (username: string, password: string, displayName: string, role?: string) => Promise<boolean>
  updateUserRole: (userId: string, role: string) => Promise<boolean>
  updateUsername: (userId: string, username: string) => Promise<boolean>
  // Per-record re-auth tracking
  authorizedRecords: Set<string>
  authorizeRecord: (recordId: string) => void
  isEditAuthorized: (recordId: string) => boolean
  clearAllAuthorizations: () => void
  // Inactivity
  lastActivity: number
  resetInactivity: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [users, setUsers] = useState<UserInfo[]>(() => {
    if (typeof window === "undefined") return []

    try {
      const cached = sessionStorage.getItem("auth-users")
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [authorizedRecords, setAuthorizedRecords] = useState<Set<string>>(new Set())
  const inactivityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isLockingRef = useRef(false)

  // Fetch minimal user list from the public endpoint. Used to populate the
  // LoginDialog before the user has a session — admin-gated /api/auth/users
  // would 401 here and leave the login form with no selectable user.
  const fetchLoginUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/login-users")
      if (!res.ok) {
        setUsers([])
        sessionStorage.removeItem("auth-users")
        return
      }

      const data = await res.json()
      setUsers(data)
      sessionStorage.setItem("auth-users", JSON.stringify(data))
    } catch {}
  }, [])

  // Fetch full user list (with role) from the admin-gated endpoint.
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/users")
      if (!res.ok) {
        setUsers([])
        sessionStorage.removeItem("auth-users")
        return
      }

      const data = await res.json()
      setUsers(data)
      sessionStorage.setItem("auth-users", JSON.stringify(data))
    } catch {}
  }, [])

  // Pre-auth: load the public user list on mount and whenever the session
  // drops (logout / inactivity lock) so the login form always has users.
  useEffect(() => {
    if (isAuthenticated) return

    fetchLoginUsers()
  }, [fetchLoginUsers, isAuthenticated])

  // Post-auth: enrich the user list with role info (user-management UI).
  useEffect(() => {
    if (!isAuthenticated) return

    fetchUsers()
  }, [fetchUsers, isAuthenticated])

  // Verify session on mount (cookie-based)
  useEffect(() => {
    fetch("/api/auth/verify", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setUser(data.user)
          setIsAuthenticated(true)
          setLastActivity(Date.now())
        } else {
          void fetchLoginUsers()
        }
      })
      .catch(() => {
        void fetchLoginUsers()
      })
  }, [fetchLoginUsers])

  // Inactivity timer
  useEffect(() => {
    if (!isAuthenticated) return

    const checkInactivity = () => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT && !isLockingRef.current) {
        isLockingRef.current = true
        // Lock session but keep server-side session cookie intact
        setIsAuthenticated(false)
        setAuthorizedRecords(new Set())
        toast.warning("Sesión bloqueada por inactividad", {
          description: "Introduzca su contraseña para continuar",
          duration: 5000,
        })
        isLockingRef.current = false
      }
    }

    inactivityTimerRef.current = setInterval(checkInactivity, 10000)
    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current)
    }
  }, [isAuthenticated, lastActivity])

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"]
    const handler = () => setLastActivity(Date.now())

    events.forEach(event => window.addEventListener(event, handler, { passive: true }))
    return () => {
      events.forEach(event => window.removeEventListener(event, handler))
    }
  }, [isAuthenticated])

  const resetInactivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setIsAuthenticated(true)
        setLastActivity(Date.now())
        setAuthorizedRecords(new Set())
        return true
      } else {
        return false
      }
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    }).catch(() => {})
    setUser(null)
    setIsAuthenticated(false)
    setAuthorizedRecords(new Set())
    sessionStorage.removeItem("auth-users")
    void fetchLoginUsers()
  }, [fetchLoginUsers])

  const verifySession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/verify", { method: "POST" })
      const data = await res.json()
      return data.valid === true
    } catch {
      return false
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Contraseña actualizada correctamente")
        return true
      } else {
        toast.error(data.error || "Error al cambiar contraseña")
        return false
      }
    } catch {
      toast.error("Error al cambiar contraseña")
      return false
    }
  }, [])

  const createUser = useCallback(async (username: string, password: string, displayName: string, role?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName, role }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Usuario creado correctamente")
        fetchUsers()
        return true
      } else {
        toast.error(data.error || "Error al crear usuario")
        return false
      }
    } catch {
      toast.error("Error al crear usuario")
      return false
    }
  }, [fetchUsers])

  const updateUserRole = useCallback(async (userId: string, role: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Rol actualizado correctamente")
        fetchUsers()
        return true
      } else {
        toast.error(data.error || "Error al actualizar rol")
        return false
      }
    } catch {
      toast.error("Error al actualizar rol")
      return false
    }
  }, [fetchUsers])

  const updateUsername = useCallback(async (userId: string, username: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, username }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Nombre de usuario actualizado correctamente")
        if (data.id && user?.id === data.id) {
          setUser(prev => prev ? { ...prev, username: data.username } : prev)
        }
        fetchUsers()
        return true
      } else {
        toast.error(data.error || "Error al actualizar nombre de usuario")
        return false
      }
    } catch {
      toast.error("Error al actualizar nombre de usuario")
      return false
    }
  }, [fetchUsers, user?.id])

  // Per-record authorization
  const authorizeRecord = useCallback((recordId: string) => {
    setAuthorizedRecords(prev => {
      const next = new Set(prev)
      next.add(recordId)
      return next
    })
    setLastActivity(Date.now())
  }, [])

  const isEditAuthorized = useCallback((recordId: string) => {
    return authorizedRecords.has(recordId)
  }, [authorizedRecords])

  const clearAllAuthorizations = useCallback(() => {
    setAuthorizedRecords(new Set())
  }, [])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        users,
        login,
        logout,
        verifySession,
        changePassword,
        createUser,
        updateUserRole,
        updateUsername,
        authorizedRecords,
        authorizeRecord,
        isEditAuthorized,
        clearAllAuthorizations,
        lastActivity,
        resetInactivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
