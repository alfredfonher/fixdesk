import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminSession(req)

    if (!auth.ok) {
      return auth.response
    }

    const { message, model, apiUrl, apiKey } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'Mensaje es requerido' }, { status: 400 })
    }

    const baseUrl = apiUrl || 'http://localhost:11434'
    const url = `${baseUrl}/api/chat`

    // Get current data for context
    const [clients, repairs] = await Promise.all([
      db.client.findMany(),
      db.repair.findMany({ include: { client: true } }),
    ])

    const repairRevenue = repairs
      .filter(r => r.status === 'completed' || r.status === 'delivered')
      .reduce((sum, r) => sum + r.proposedPrice, 0)

    const systemPrompt = `Eres un asistente inteligente para la aplicación FixDesk, un sistema de gestión para un taller de reparación de laptops.

DATOS ACTUALES DEL SISTEMA:
- Clientes registrados: ${clients.length}
- Reparaciones: ${repairs.length} (Pendientes: ${repairs.filter(r => r.status === 'pending').length}, En progreso: ${repairs.filter(r => r.status === 'in_progress').length}, Completadas: ${repairs.filter(r => r.status === 'completed').length}, Entregadas: ${repairs.filter(r => r.status === 'delivered').length})
- Ingresos por reparaciones: $${repairRevenue.toFixed(2)}

Puedes responder preguntas sobre el estado de las reparaciones, hacer resúmenes, dar recomendaciones, y ayudar con la gestión del taller. Responde siempre en español de forma clara y concisa.`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        error: `Error del modelo: ${response.status} - ${errorText}`,
      }, { status: response.status })
    }

    const data = await response.json()
    const reply = data.message?.content || data.choices?.[0]?.message?.content || 'Sin respuesta del modelo'

    return NextResponse.json({ reply, model: data.model || model })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({
      error: `Error al conectar con Ollama: ${msg}. ¿Está Ollama ejecutándose?`,
    }, { status: 500 })
  }
}
