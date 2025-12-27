/**
 * Quota Hook
 * 
 * Client-side hook for managing rate limit quota.
 * Generates a fingerprint and tracks remaining analyses.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export interface QuotaInfo {
  enabled: boolean;
  remaining: number;
  limit: number;
  resetAt: string | null;
}

// ============================================================================
// Fingerprint Generation
// ============================================================================

/**
 * Generate a simple browser fingerprint
 * Not meant to be cryptographically secure, just reasonably unique
 */
function generateFingerprint(): string {
  const components: string[] = [];
  
  // Screen info
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Hardware concurrency
  if (navigator.hardwareConcurrency) {
    components.push(`cores:${navigator.hardwareConcurrency}`);
  }
  
  // Device memory (if available)
  if ("deviceMemory" in navigator) {
    components.push(`mem:${(navigator as Navigator & { deviceMemory?: number }).deviceMemory}`);
  }
  
  // Touch support
  components.push(`touch:${navigator.maxTouchPoints || 0}`);
  
  // Canvas fingerprint (simplified)
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("ImageToWo🚴", 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    // Canvas blocked
  }
  
  // Simple hash of components
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Storage
// ============================================================================

const FINGERPRINT_KEY = "imagetowo-fp";
const QUOTA_CACHE_KEY = "imagetowo-quota";

function getStoredFingerprint(): string {
  if (typeof window === "undefined") return "";
  
  let fp = localStorage.getItem(FINGERPRINT_KEY);
  if (!fp) {
    fp = generateFingerprint();
    localStorage.setItem(FINGERPRINT_KEY, fp);
  }
  return fp;
}

function getCachedQuota(): QuotaInfo | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(QUOTA_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (less than 5 minutes old)
      if (data.cachedAt && Date.now() - data.cachedAt < 5 * 60 * 1000) {
        return data.quota;
      }
    }
  } catch {
    // Invalid cache
  }
  return null;
}

function setCachedQuota(quota: QuotaInfo): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify({
      quota,
      cachedAt: Date.now(),
    }));
  } catch {
    // Storage full or blocked
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useQuota() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");

  // Initialize fingerprint
  useEffect(() => {
    setFingerprint(getStoredFingerprint());
    
    // Try to load cached quota immediately
    const cached = getCachedQuota();
    if (cached) {
      setQuota(cached);
      setLoading(false);
    }
  }, []);

  // Fetch quota from server
  const fetchQuota = useCallback(async () => {
    if (!fingerprint) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/workouts/quota", {
        headers: {
          "X-Client-Fingerprint": fingerprint,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch quota");
      }
      
      const data: QuotaInfo = await response.json();
      setQuota(data);
      setCachedQuota(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [fingerprint]);

  // Fetch on mount and when fingerprint is ready
  useEffect(() => {
    if (fingerprint) {
      fetchQuota();
    }
  }, [fingerprint, fetchQuota]);

  // Update quota after a parse (call this after successful upload)
  const updateQuota = useCallback((newRemaining: number, limit: number, resetAt: string) => {
    const updated: QuotaInfo = {
      enabled: true,
      remaining: newRemaining,
      limit,
      resetAt,
    };
    setQuota(updated);
    setCachedQuota(updated);
  }, []);

  // Decrement locally (optimistic update)
  const decrementQuota = useCallback(() => {
    setQuota(prev => {
      if (!prev || !prev.enabled) return prev;
      const updated = { ...prev, remaining: Math.max(0, prev.remaining - 1) };
      setCachedQuota(updated);
      return updated;
    });
  }, []);

  return {
    quota,
    loading,
    error,
    fingerprint,
    fetchQuota,
    updateQuota,
    decrementQuota,
    hasQuota: quota ? (quota.enabled ? quota.remaining > 0 : true) : true,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format time until reset in human-readable format
 */
export function formatResetTime(resetAt: string | null, locale: string = "en"): string {
  if (!resetAt) return "";
  
  const reset = new Date(resetAt);
  const now = new Date();
  const diff = reset.getTime() - now.getTime();
  
  if (diff <= 0) return locale === "fr" ? "Maintenant" : "Now";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (locale === "fr") {
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  }
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
