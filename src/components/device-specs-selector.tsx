"use client"

import { useState } from "react"
import { STORAGE_TYPES, STORAGE_CAPACITIES, RAM_TYPES, RAM_SIZES, RAM_STICKS, GPU_MODELS, VRAM_SIZES, VRAM_TYPES } from "@/lib/constants"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface DeviceSpecsProps {
  brand: string
  model: string
  storageType: string
  storageCapacity: string
  ramType: string
  ramSize: string
  ramSticks: string
  gpuModel: string
  vramSize: string
  vramType: string
  onChange: (field: string, value: string) => void
}

export function DeviceSpecsSelector({
  brand, model, storageType, storageCapacity, ramType, ramSize, ramSticks, gpuModel, vramSize, vramType, onChange,
}: DeviceSpecsProps) {
  const [gpuOtraSelected, setGpuOtraSelected] = useState(false)
  const isOtraGpu = gpuOtraSelected || (!!gpuModel && !GPU_MODELS.some(g => g.value === gpuModel))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Marca *</Label>
          <Input
            placeholder="Dell, HP, Lenovo..."
            value={brand}
            onChange={(e) => onChange("brand", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Modelo *</Label>
          <Input
            placeholder="Inspiron 15..."
            value={model}
            onChange={(e) => onChange("model", e.target.value)}
          />
        </div>
      </div>

      <Separator />

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Almacenamiento</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Disco</Label>
            <Select value={storageType} onValueChange={(v) => onChange("storageType", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {STORAGE_TYPES.map(st => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Capacidad</Label>
            <Select value={storageCapacity} onValueChange={(v) => onChange("storageCapacity", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {STORAGE_CAPACITIES.map(sc => (
                  <SelectItem key={sc.value} value={sc.value}>{sc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Memoria RAM</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de RAM</Label>
            <Select value={ramType} onValueChange={(v) => onChange("ramType", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {RAM_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tamaño RAM</Label>
            <Select value={ramSize} onValueChange={(v) => onChange("ramSize", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {RAM_SIZES.map(rs => (
                  <SelectItem key={rs.value} value={rs.value}>{rs.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Módulos</Label>
            <Select value={ramSticks} onValueChange={(v) => onChange("ramSticks", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {RAM_STICKS.map(rs => (
                  <SelectItem key={rs.value} value={rs.value}>{rs.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">GPU / Gráfica</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Modelo GPU</Label>
            <Select
              value={isOtraGpu ? 'Otra' : gpuModel}
              onValueChange={(v) => {
                if (v === 'Otra') {
                  setGpuOtraSelected(true)
                  onChange("gpuModel", '')
                } else {
                  setGpuOtraSelected(false)
                  onChange("gpuModel", v)
                }
              }}
            >
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {GPU_MODELS.map(g => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isOtraGpu && (
              <Input
                placeholder="Escriba el modelo de GPU..."
                value={gpuModel}
                onChange={(e) => onChange("gpuModel", e.target.value)}
                className="mt-1"
              />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">VRAM</Label>
            <Select value={vramSize} onValueChange={(v) => onChange("vramSize", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {VRAM_SIZES.map(v => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo VRAM</Label>
            <Select value={vramType} onValueChange={(v) => onChange("vramType", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {VRAM_TYPES.map(v => (
                  <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
