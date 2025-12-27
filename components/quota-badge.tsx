"use client";

/**
 * Quota Badge Component
 * 
 * Displays remaining daily analyses quota.
 * Shows warning when quota is low or exhausted.
 */

import { useQuota, formatResetTime } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";
import { Zap, AlertTriangle, Clock } from "lucide-react";

export function QuotaBadge() {
  const { quota, loading } = useQuota();
  const { t, locale } = useI18n();

  // Don't render anything while loading or if quota is disabled
  if (loading || !quota?.enabled) {
    return null;
  }

  const { remaining, limit, resetAt } = quota;
  const isLow = remaining <= 2 && remaining > 0;
  const isExhausted = remaining === 0;

  // Determine color based on quota status
  const getColorClasses = () => {
    if (isExhausted) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (isLow) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  };

  const getIcon = () => {
    if (isExhausted) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (isLow) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <Zap className="w-3.5 h-3.5" />;
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getColorClasses()}`}>
      {getIcon()}
      {isExhausted ? (
        <span className="flex items-center gap-1.5">
          {t("quotaExhausted")}
          <Clock className="w-3 h-3" />
          <span className="text-xs opacity-75">
            {formatResetTime(resetAt, locale)}
          </span>
        </span>
      ) : (
        <span>
          <span className="font-bold">{remaining}</span>
          <span className="opacity-75">/{limit}</span>
          <span className="ml-1 hidden sm:inline">{t("quotaRemaining")}</span>
        </span>
      )}
    </div>
  );
}

/**
 * Compact quota indicator for header
 */
export function QuotaIndicator() {
  const { quota, loading } = useQuota();
  const { locale } = useI18n();

  if (loading || !quota?.enabled) {
    return null;
  }

  const { remaining, limit, resetAt } = quota;
  const percentage = (remaining / limit) * 100;
  const isExhausted = remaining === 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <Zap className={`w-4 h-4 ${isExhausted ? "text-red-500" : "text-yellow-500"}`} />
        <span className={isExhausted ? "text-red-500 font-medium" : ""}>
          {remaining}/{limit}
        </span>
      </div>
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            isExhausted 
              ? "bg-red-500" 
              : percentage <= 40 
                ? "bg-yellow-500" 
                : "bg-green-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isExhausted && (
        <span className="text-xs text-gray-500">
          {formatResetTime(resetAt, locale)}
        </span>
      )}
    </div>
  );
}
