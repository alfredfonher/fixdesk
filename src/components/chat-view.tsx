"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, Settings, Sparkles, TrendingUp, MessageSquare, Loader2, AlertCircle, Save } from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiUrl, setApiUrl] = useState("http://localhost:11434")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("llama3.2")
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()
        if (data.ollama_api_url) setApiUrl(data.ollama_api_url)
        if (data.ollama_api_key) setApiKey(data.ollama_api_key)
        if (data.ollama_model) setModel(data.ollama_model)
      } catch {}
    }

    loadSettings()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const saveSettings = async () => {
    try {
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ollama_api_url", value: apiUrl }),
      })
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ollama_api_key", value: apiKey }),
      })
      await fetch("/api/settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ollama_model", value: model }),
      })
      toast.success("Configuración guardada")
    } catch {
      toast.error("Error al guardar configuración")
    }
  }

  const testConnection = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/tags`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        const models = (data.models || []).map((m: { name: string }) => m.name)
        setAvailableModels(models)
        setConnected(true)
        toast.success(`Conectado a Ollama. ${models.length} modelos disponibles.`)
        if (models.length > 0 && !models.includes(model)) {
          setModel(models[0])
        }
      } else {
        setConnected(false)
        toast.error("No se pudo conectar a Ollama")
      }
    } catch {
      setConnected(false)
      toast.error("Error de conexión. ¿Está Ollama ejecutándose?")
    }
  }

  const sendMessage = async (messageText?: string) => {
    const msg = messageText || input.trim()
    if (!msg) return

    setInput("")
    const userMessage: ChatMessage = { role: "user", content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, model, apiUrl, apiKey }),
      })
      const data = await res.json()
      if (data.error) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `❌ Error: ${data.error}`,
          timestamp: new Date(),
        }])
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Error de conexión con el servidor.",
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { icon: <TrendingUp className="w-3.5 h-3.5" />, text: "Resumen financiero de la semana", message: "Dame un resumen financiero de la semana: ingresos, gastos, beneficio neto y comparación con la semana anterior si es posible" },
    { icon: <Sparkles className="w-3.5 h-3.5" />, text: "Estado del taller", message: "¿Cómo va el taller? Dame un resumen general de las reparaciones, ventas y estado del inventario" },
    { icon: <MessageSquare className="w-3.5 h-3.5" />, text: "Garantías próximas a vencer", message: "¿Qué garantías están próximas a vencer en los próximos 7 días?" },
  ]

  return (
    <div className="flex h-full">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-violet-500" />
            <h1 className="font-bold">Asistente IA</h1>
            <Badge variant={connected ? "default" : "secondary"} className="text-[10px]">
              {connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md">
                <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold">Asistente TechFix Pro</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pregúntame sobre el estado de tu taller, resúmenes financieros, garantías, o cualquier consulta sobre tus datos.
                  </p>
                </div>
                <div className="space-y-2">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(qp.message)}
                      disabled={!connected}
                      className="w-full flex items-center gap-2 p-3 rounded-lg border text-sm text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {qp.icon}
                      <span>{qp.text}</span>
                    </button>
                  ))}
                </div>
                {!connected && (
                  <div className="flex items-center gap-2 justify-center text-amber-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Configura la conexión a Ollama primero</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.timestamp.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Pensando...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              placeholder={connected ? "Escribe tu pregunta..." : "Configura Ollama primero..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              rows={1}
              className="resize-none min-h-[40px]"
              disabled={!connected || loading}
            />
            <Button onClick={() => sendMessage()} disabled={!connected || loading || !input.trim()} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-80 shrink-0 border-l p-4 space-y-4 overflow-y-auto">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configuración Ollama
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">URL del servidor</Label>
              <Input value={apiUrl} onChange={e => setApiUrl(e.target.value)} placeholder="http://localhost:11434" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">API Key (opcional)</Label>
              <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." type="password" />
              <p className="text-[10px] text-muted-foreground">Solo si usas un proxy con autenticación</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Modelo</Label>
              {availableModels.length > 0 ? (
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={model} onChange={e => setModel(e.target.value)} placeholder="llama3.2" />
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={testConnection} className="flex-1 gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Probar
              </Button>
              <Button onClick={saveSettings} className="flex-1 gap-1">
                <Save className="w-3.5 h-3.5" /> Guardar
              </Button>
            </div>

            {connected && availableModels.length > 0 && (
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">MODELOS DISPONIBLES</p>
                  <div className="space-y-1">
                    {availableModels.map(m => (
                      <div key={m} className="flex items-center justify-between text-xs">
                        <span>{m}</span>
                        {m === model && <Badge variant="default" className="text-[9px] px-1 py-0">Activo</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Ollama</strong> debe estar ejecutándose localmente o en una URL accesible.
                  Descárgalo desde <strong>ollama.com</strong> y ejecuta <code className="bg-muted px-1 rounded">ollama serve</code>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
