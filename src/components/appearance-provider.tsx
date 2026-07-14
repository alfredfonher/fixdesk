"use client";

import { useEffect } from "react";
import { useAppearanceStore, writeAppearanceToStorage } from "@/lib/appearance/store";

/**
 * Client-side applier for the appearance layer.
 *
 * Reads the persisted palette/style/density from localStorage on mount,
 * applies the corresponding data-* attributes to <html>, and keeps them
 * in sync with the zustand store.
 *
 * This component does NOT need to render anything; it just side-effects
 * the document element. It must live inside <ThemeProvider> in the root
 * layout so the data-* attributes are present as soon as children render.
 */
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const palette = useAppearanceStore((s) => s.palette);
  const style = useAppearanceStore((s) => s.style);
  const density = useAppearanceStore((s) => s.density);

  // Hydrate from localStorage on mount (client-only, no SSR mismatch).
  useEffect(() => {
    useAppearanceStore.getState().hydrateFromStorage();
  }, []);

  // Reflect the store state onto <html> via data-* attributes.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.palette = palette;
    html.dataset.style = style;
    html.dataset.density = density;
  }, [palette, style, density]);

  // Persist on change.
  useEffect(() => {
    writeAppearanceToStorage({ palette, style, density });
  }, [palette, style, density]);

  return <>{children}</>;
}
