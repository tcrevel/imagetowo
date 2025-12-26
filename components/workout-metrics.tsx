"use client";

/**
 * Workout Metrics Component
 * 
 * Displays TSS, IF, NP, and duration for a workout.
 */

import React, { useState } from "react";
import { Settings, Clock, Zap, Activity, TrendingUp } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { useTranslation } from "@/lib/i18n";
import { calculateWorkoutMetrics, formatDuration, getTssCategory } from "@/lib/utils/metrics";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Workout } from "@/lib/schemas";

interface WorkoutMetricsProps {
  workout: Workout;
}

export function WorkoutMetrics({ workout }: WorkoutMetricsProps) {
  const { settings, updateSettings, isHydrated } = useSettings();
  const t = useTranslation();
  const [isEditingFtp, setIsEditingFtp] = useState(false);
  const [ftpInput, setFtpInput] = useState(settings.ftp.toString());

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-3 animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const metrics = calculateWorkoutMetrics(workout, settings.ftp);
  const tssCategory = getTssCategory(metrics.tss);

  const handleFtpSubmit = () => {
    const num = parseInt(ftpInput, 10);
    if (!isNaN(num) && num >= 50 && num <= 500) {
      updateSettings({ ftp: num });
    } else {
      setFtpInput(settings.ftp.toString());
    }
    setIsEditingFtp(false);
  };

  return (
    <div className="space-y-3">
      {/* FTP Input Row */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">FTP</span>
        </div>
        {isEditingFtp ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={50}
              max={500}
              value={ftpInput}
              onChange={(e) => setFtpInput(e.target.value)}
              onBlur={handleFtpSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleFtpSubmit()}
              className="w-20 h-8 text-center"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">W</span>
          </div>
        ) : (
          <button
            onClick={() => {
              setFtpInput(settings.ftp.toString());
              setIsEditingFtp(true);
            }}
            className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors"
          >
            {settings.ftp} W
            <span className="text-xs text-muted-foreground">(click to edit)</span>
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Duration */}
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label={t("duration")}
          value={formatDuration(metrics.totalDuration)}
          color="text-blue-600"
        />

        {/* TSS */}
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="TSS"
          value={metrics.tss.toString()}
          subValue={tssCategory.label}
          color={tssCategory.color}
        />

        {/* IF */}
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="IF"
          value={metrics.intensityFactor.toFixed(2)}
          color="text-orange-600"
        />

        {/* NP */}
        <MetricCard
          icon={<Zap className="h-4 w-4" />}
          label="NP"
          value={`${metrics.normalizedPower}W`}
          subValue={`Avg: ${metrics.averagePower}W`}
          color="text-purple-600"
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}

function MetricCard({ icon, label, value, subValue, color }: MetricCardProps) {
  return (
    <div className="bg-card border rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <div className={cn("text-xl font-bold", color)}>
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-muted-foreground mt-0.5">
          {subValue}
        </div>
      )}
    </div>
  );
}
