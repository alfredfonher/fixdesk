"use client";

import { create } from "zustand";
import {
  DEFAULT_DENSITY,
  DEFAULT_PALETTE,
  DEFAULT_VISUAL_STYLE,
  type DensityId,
  type PaletteId,
  type VisualStyleId,
} from "./registry";

export const APPEARANCE_STORAGE_KEY = "fixdesk.appearance.v1";

export interface AppearanceState {
  palette: PaletteId;
  style: VisualStyleId;
  density: DensityId;
  hydrated: boolean;
  setPalette: (palette: PaletteId) => void;
  setStyle: (style: VisualStyleId) => void;
  setDensity: (density: DensityId) => void;
  hydrateFromStorage: () => void;
}

interface PersistedShape {
  palette: PaletteId;
  style: VisualStyleId;
  density: DensityId;
}

function isPaletteId(v: unknown): v is PaletteId {
  return v === "sapphire" || v === "emerald" || v === "graphite";
}

function isStyleId(v: unknown): v is VisualStyleId {
  return v === "macos-classic" || v === "macos-glass";
}

function isDensityId(v: unknown): v is DensityId {
  return v === "comfortable" || v === "compact";
}

function readPersisted(): PersistedShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (
      !isPaletteId(obj.palette) ||
      !isStyleId(obj.style) ||
      !isDensityId(obj.density)
    ) {
      return null;
    }
    return {
      palette: obj.palette,
      style: obj.style,
      density: obj.density,
    };
  } catch {
    return null;
  }
}

export const useAppearanceStore = create<AppearanceState>((set) => ({
  palette: DEFAULT_PALETTE,
  style: DEFAULT_VISUAL_STYLE,
  density: DEFAULT_DENSITY,
  hydrated: false,
  setPalette: (palette) => set({ palette }),
  setStyle: (style) => set({ style }),
  setDensity: (density) => set({ density }),
  hydrateFromStorage: () => {
    const persisted = readPersisted();
    if (persisted) {
      set({
        palette: persisted.palette,
        style: persisted.style,
        density: persisted.density,
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
}));

/**
 * Writes the current appearance state to localStorage.
 * Intended to be called by the AppearanceProvider on every change.
 */
export function writeAppearanceToStorage(
  state: Pick<AppearanceState, "palette" | "style" | "density">,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedShape = {
      palette: state.palette,
      style: state.style,
      density: state.density,
    };
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    /* swallow: storage may be unavailable in private modes */
  }
}
