"use client";

/**
 * StepEditor Component
 * 
 * Edit individual workout step parameters.
 * Adapts form fields based on step type.
 */

import React from "react";
import { Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n";
import type { Step, StepType } from "@/lib/schemas";

// ============================================================================
// Types
// ============================================================================

interface StepEditorProps {
  step: Step;
  index: number;
  onChange: (step: Step) => void;
  onDelete: () => void;
  className?: string;
  // Drag and drop props
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragLeave?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STEP_COLORS: Record<StepType, string> = {
  warmup: "border-l-orange-500 bg-orange-500/5",
  cooldown: "border-l-blue-500 bg-blue-500/5",
  steady: "border-l-green-500 bg-green-500/5",
  intervals: "border-l-red-500 bg-red-500/5",
  freeride: "border-l-gray-500 bg-gray-500/5",
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:00`;
}

function parseDuration(value: string): number {
  const parts = value.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  return parseInt(value, 10) * 60 || 60;
}

// ============================================================================
// Component
// ============================================================================

export function StepEditor({
  step,
  index,
  onChange,
  onDelete,
  className,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDragLeave,
}: StepEditorProps) {
  const t = useTranslation();
  
  // Type-safe update functions for each step type
  const updateWarmup = (updates: Partial<Extract<Step, { type: "warmup" }>>) => {
    if (step.type === "warmup") {
      onChange({ ...step, ...updates });
    }
  };

  const updateCooldown = (updates: Partial<Extract<Step, { type: "cooldown" }>>) => {
    if (step.type === "cooldown") {
      onChange({ ...step, ...updates });
    }
  };

  const updateSteady = (updates: Partial<Extract<Step, { type: "steady" }>>) => {
    if (step.type === "steady") {
      onChange({ ...step, ...updates });
    }
  };

  const updateIntervals = (updates: Partial<Extract<Step, { type: "intervals" }>>) => {
    if (step.type === "intervals") {
      onChange({ ...step, ...updates });
    }
  };

  const updateFreeride = (updates: Partial<Extract<Step, { type: "freeride" }>>) => {
    if (step.type === "freeride") {
      onChange({ ...step, ...updates });
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragLeave={onDragLeave}
      className={cn(
        "border-l-4 rounded-lg p-4 transition-all",
        STEP_COLORS[step.type],
        isDragging && "opacity-50 scale-95",
        isDragOver && "ring-2 ring-primary ring-offset-2",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
          <span className="text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <span className="font-medium">{t(step.type)}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={`Delete step ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Fields based on step type */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {step.type === "warmup" && (
          <>
            <DurationField
              value={step.duration_s}
              onChange={(v) => updateWarmup({ duration_s: v })}
            />
            <PowerField
              label={t("startPower")}
              value={step.power_start_pct}
              onChange={(v) => updateWarmup({ power_start_pct: v })}
            />
            <PowerField
              label={t("endPower")}
              value={step.power_end_pct}
              onChange={(v) => updateWarmup({ power_end_pct: v })}
            />
          </>
        )}

        {step.type === "cooldown" && (
          <>
            <DurationField
              value={step.duration_s}
              onChange={(v) => updateCooldown({ duration_s: v })}
            />
            <PowerField
              label={t("startPower")}
              value={step.power_start_pct}
              onChange={(v) => updateCooldown({ power_start_pct: v })}
            />
            <PowerField
              label={t("endPower")}
              value={step.power_end_pct}
              onChange={(v) => updateCooldown({ power_end_pct: v })}
            />
          </>
        )}

        {step.type === "steady" && (
          <>
            <DurationField
              value={step.duration_s}
              onChange={(v) => updateSteady({ duration_s: v })}
            />
            <PowerField
              label={t("power")}
              value={step.power_pct}
              onChange={(v) => updateSteady({ power_pct: v })}
            />
          </>
        )}

        {step.type === "intervals" && (
          <>
            <div>
              <Label htmlFor={`repeat-${index}`} className="text-xs">
                {t("repeat")}
              </Label>
              <Input
                id={`repeat-${index}`}
                type="number"
                min={1}
                max={50}
                value={step.repeat}
                onChange={(e) =>
                  updateIntervals({ repeat: parseInt(e.target.value, 10) || 1 })
                }
                className="h-8 mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`on-duration-${index}`} className="text-xs">
                {t("onDuration")}
              </Label>
              <Input
                id={`on-duration-${index}`}
                value={formatDuration(step.on_duration_s)}
                onChange={(e) =>
                  updateIntervals({ on_duration_s: parseDuration(e.target.value) })
                }
                placeholder="1:00"
                className="h-8 mt-1"
              />
            </div>
            <div>
              <Label htmlFor={`off-duration-${index}`} className="text-xs">
                {t("offDuration")}
              </Label>
              <Input
                id={`off-duration-${index}`}
                value={formatDuration(step.off_duration_s)}
                onChange={(e) =>
                  updateIntervals({ off_duration_s: parseDuration(e.target.value) })
                }
                placeholder="1:00"
                className="h-8 mt-1"
              />
            </div>
            <PowerField
              label={t("onPower")}
              value={step.on_power_pct}
              onChange={(v) => updateIntervals({ on_power_pct: v })}
            />
            <PowerField
              label={t("offPower")}
              value={step.off_power_pct}
              onChange={(v) => updateIntervals({ off_power_pct: v })}
            />
          </>
        )}

        {step.type === "freeride" && (
          <DurationField
            value={step.duration_s}
            onChange={(v) => updateFreeride({ duration_s: v })}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function DurationField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslation();
  return (
    <div>
      <Label className="text-xs">{t("duration")}</Label>
      <Input
        value={formatDuration(value)}
        onChange={(e) => onChange(parseDuration(e.target.value))}
        placeholder="5:00"
        className="h-8 mt-1"
      />
    </div>
  );
}

function PowerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label} (%FTP)</Label>
      <Input
        type="number"
        min={0}
        max={200}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="h-8 mt-1"
      />
    </div>
  );
}
