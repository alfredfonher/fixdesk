/**
 * Appearance registry: palettes, visual styles, density modes.
 *
 * This is the single source of truth for which palettes/styles/densities
 * exist and what their stable IDs are. The CSS in `src/app/globals.css`
 * MUST define a matching selector for every palette id (e.g.
 * `[data-palette="sapphire"]`, `.dark[data-palette="sapphire"]`) so that
 * switching palettes at runtime actually changes the brand tokens.
 */

export const PALETTE_IDS = ["sapphire", "emerald", "graphite"] as const;
export type PaletteId = (typeof PALETTE_IDS)[number];

export const VISUAL_STYLE_IDS = ["macos-classic", "macos-glass"] as const;
export type VisualStyleId = (typeof VISUAL_STYLE_IDS)[number];

export const DENSITY_IDS = ["comfortable", "compact"] as const;
export type DensityId = (typeof DENSITY_IDS)[number];

export interface PaletteDescriptor {
  id: PaletteId;
  label: string;
  description: string;
}

export interface VisualStyleDescriptor {
  id: VisualStyleId;
  label: string;
  description: string;
  ready: boolean;
}

export interface DensityDescriptor {
  id: DensityId;
  label: string;
  description: string;
}

export const DEFAULT_PALETTE: PaletteId = "sapphire";
export const DEFAULT_VISUAL_STYLE: VisualStyleId = "macos-classic";
export const DEFAULT_DENSITY: DensityId = "comfortable";

export const PALETTES: readonly PaletteDescriptor[] = [
  {
    id: "sapphire",
    label: "Sapphire",
    description: "macOS sobrio y profesional (azul sistema)",
  },
  {
    id: "emerald",
    label: "Emerald",
    description: "Verde técnico clásico",
  },
  {
    id: "graphite",
    label: "Graphite",
    description: "Gris azulado, máxima neutralidad",
  },
] as const;

export const VISUAL_STYLES: readonly VisualStyleDescriptor[] = [
  {
    id: "macos-classic",
    label: "macOS Classic",
    description: "Opaco y sobrio, sin efectos",
    ready: true,
  },
  {
    id: "macos-glass",
    label: "macOS Glass",
    description: "Translúcido con blur (preparado)",
    ready: false,
  },
] as const;

export const DENSITIES: readonly DensityDescriptor[] = [
  {
    id: "comfortable",
    label: "Cómoda",
    description: "Espaciado amplio, esquinas suaves",
  },
  {
    id: "compact",
    label: "Compacta",
    description: "Más denso, esquinas levemente menores",
  },
] as const;

export function getPalette(id: PaletteId): PaletteDescriptor {
  const found = PALETTES.find((p) => p.id === id);
  if (!found) {
    throw new Error(`Unknown palette: ${id}`);
  }
  return found;
}

export function getVisualStyle(id: VisualStyleId): VisualStyleDescriptor {
  const found = VISUAL_STYLES.find((s) => s.id === id);
  if (!found) {
    throw new Error(`Unknown visual style: ${id}`);
  }
  return found;
}

export function getDensity(id: DensityId): DensityDescriptor {
  const found = DENSITIES.find((d) => d.id === id);
  if (!found) {
    throw new Error(`Unknown density: ${id}`);
  }
  return found;
}

/**
 * Returns the next palette in the cycle, wrapping around.
 * Used by the tiny sidebar cycle button.
 */
export function getNextPalette(current: PaletteId): PaletteId {
  const idx = PALETTE_IDS.indexOf(current);
  const next = PALETTE_IDS[(idx + 1) % PALETTE_IDS.length];
  return next ?? DEFAULT_PALETTE;
}
