"use client";

import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppearanceStore } from "@/lib/appearance/store";
import { DENSITIES, PALETTES, VISUAL_STYLES } from "@/lib/appearance/registry";
import { useFirstRun } from "@/hooks/useFirstRun";
import { Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

export function FirstRunWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { theme, setTheme } = useTheme();
  const { completed, loading, persistWizard } = useFirstRun();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const palette = useAppearanceStore((s) => s.palette);
  const style = useAppearanceStore((s) => s.style);
  const density = useAppearanceStore((s) => s.density);
  const setPalette = useAppearanceStore((s) => s.setPalette);
  const setStyle = useAppearanceStore((s) => s.setStyle);
  const setDensity = useAppearanceStore((s) => s.setDensity);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessFocus, setBusinessFocus] = useState("laptops");
  const [currency, setCurrency] = useState("CUP");
  const [exchangeRate, setExchangeRate] = useState("25");

  const themeOptions = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
  ] as const;

  const handleFinish = useCallback(async () => {
    setSubmitting(true);
    try {
      await persistWizard({
        username,
        password,
        displayName,
        businessFocus,
        currency,
        exchangeRate,
        appearancePalette: palette,
        appearanceStyle: style,
        appearanceDensity: density,
        themeMode: theme || "system",
      });
      toast.success("Configuración inicial guardada");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la configuración inicial");
    } finally {
      setSubmitting(false);
    }
  }, [persistWizard, username, password, displayName, businessFocus, currency, exchangeRate, palette, style, density, theme, onOpenChange]);

  if (!open || loading || completed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{step === 0 ? "Bienvenido" : step === 1 ? "Usuario maestro" : step === 2 ? "Apariencia" : "Configuración base"}</DialogTitle>
          <DialogDescription>
            {step === 0 && "Esta es la primera ejecución de TechFix Pro. Vamos a dejar lista la base del sistema para empezar."}
            {step === 1 && "Definí el usuario maestro que administrará el sistema. No habrá credenciales por defecto."}
            {step === 2 && "Seleccioná tu paleta, estilo visual y densidad."}
            {step === 3 && "Indicá el foco de tu negocio, la moneda y la tasa base con la que vas a arrancar."}
          </DialogDescription>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">Al terminar vas a tener creado tu usuario maestro, la apariencia inicial y la configuración base del negocio.</p>
            <Button onClick={() => setStep(1)} className="w-full">Comenzar</Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label>Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="administrador" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre a mostrar</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Administrador" />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Mínimo 4 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar contraseña</Label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Repita la contraseña" />
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(0)}>Atrás</Button>
              <Button onClick={() => {
                if (!username.trim() || !password) return toast.error("Definí el usuario y la contraseña maestra")
                if (password.length < 4) return toast.error("La contraseña debe tener al menos 4 caracteres")
                if (password !== confirmPassword) return toast.error("Las contraseñas no coinciden")
                setStep(2)
              }}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 mt-4">
            <Label>Modo</Label>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = (theme || "system") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={`rounded-[calc(var(--ui-radius,var(--radius))+0.2rem)] border px-3 py-3 text-left transition-colors ${
                      active ? "border-brand/40 bg-brand/10 text-foreground" : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className={`mb-2 w-4 h-4 ${active ? "text-brand" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{option.label}</p>
                  </button>
                );
              })}
            </div>

            <Label>Paleta</Label>
            <Select value={palette} onValueChange={setPalette}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PALETTES.map((opt) => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>

            <Label>Estilo visual</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISUAL_STYLES.map((opt) => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>

            <Label>Densidad</Label>
            <Select value={density} onValueChange={setDensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DENSITIES.map((opt) => <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>)}</SelectContent>
            </Select>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Atrás</Button>
              <Button onClick={() => setStep(3)}>Siguiente</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 mt-4">
            <Label>Foco del negocio</Label>
            <Select value={businessFocus} onValueChange={setBusinessFocus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="laptops">Laptops</SelectItem>
                <SelectItem value="mobiles">Móviles</SelectItem>
                <SelectItem value="mixed">Mixto</SelectItem>
              </SelectContent>
            </Select>

            <Label>Moneda</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CUP">CUP — Peso Cubano</SelectItem>
                <SelectItem value="USD">USD — Dólar Americano</SelectItem>
              </SelectContent>
            </Select>

            <Label>Tasa de cambio</Label>
            <Input value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} type="number" step="0.01" />

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Atrás</Button>
              <Button onClick={handleFinish} disabled={submitting}>{submitting ? "Guardando..." : "Terminar"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
