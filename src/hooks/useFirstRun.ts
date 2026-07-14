"use client";

import { useState, useCallback, useEffect } from "react";

type PersistWizardInput = {
  username: string;
  password: string;
  displayName: string;
  businessFocus: string;
  currency: string;
  exchangeRate: string;
  appearancePalette: string;
  appearanceStyle: string;
  appearanceDensity: string;
  themeMode: string;
};

export function useFirstRun() {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [hasUsers, setHasUsers] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFlag = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap/status");
      if (res.ok) {
        const data = await res.json();
        setCompleted(data.completed === true);
        setHasUsers(data.hasUsers === true);
      } else {
        setCompleted(false);
        setHasUsers(false);
      }
    } catch {
      setCompleted(false);
      setHasUsers(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlag();
  }, [fetchFlag]);

  const persistWizard = useCallback(async (payload: PersistWizardInput) => {
    const response = await fetch('/api/bootstrap/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      const baseError = data.error || 'Error al completar la configuración inicial'
      const details = data.details ? `: ${data.details}` : ''
      throw new Error(`${baseError}${details}`)
    }

    setCompleted(true)
    setHasUsers(true)
  }, [])

  return { completed, hasUsers, loading, fetchFlag, persistWizard };
}
