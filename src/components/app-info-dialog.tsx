"use client"

import { Monitor, Package2, ShieldCheck, Sparkles } from "lucide-react"
import { APP_METADATA, getAppDisplayVersion, getAppFullName } from "@/lib/app-metadata"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

type AppInfoDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const infoCards = [
  {
    label: "Versión",
    value: getAppDisplayVersion(),
    icon: Package2,
  },
  {
    label: "Tipo de release",
    value: APP_METADATA.releaseType,
    icon: Sparkles,
  },
  {
    label: "Edición",
    value: APP_METADATA.edition,
    icon: ShieldCheck,
  },
  {
    label: "Plataforma",
    value: APP_METADATA.desktopTarget,
    icon: Monitor,
  },
] as const

export function AppInfoDialog({ open, onOpenChange }: AppInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-[calc(var(--ui-radius,var(--radius))+0.45rem)] border-border/70 bg-surface-elevated/95 backdrop-blur">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-[calc(var(--ui-radius,var(--radius))+0.35rem)] bg-brand/12 text-brand">
              <Monitor className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-xl">{getAppFullName()}</DialogTitle>
              <DialogDescription className="mt-1">
                {APP_METADATA.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
            {getAppDisplayVersion()}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {APP_METADATA.releaseType}
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {APP_METADATA.edition}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {infoCards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-[calc(var(--ui-radius,var(--radius))+0.35rem)] border border-border/70 bg-card/70 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="size-4" />
                  <span>{card.label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{card.value}</p>
              </div>
            )
          })}
        </div>

        <div className="rounded-[calc(var(--ui-radius,var(--radius))+0.35rem)] border border-dashed border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          Esta build incluye los fixes de autenticación desktop, logout al cerrar la app,
          empaquetado offline de fuentes y runtime estable de Prisma para la edición CAM.
        </div>
      </DialogContent>
    </Dialog>
  )
}
