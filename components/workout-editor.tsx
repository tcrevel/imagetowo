"use client";

/**
 * WorkoutEditor Component
 * 
 * Edit complete workout: name, description, and all steps.
 * Supports drag and drop reordering of steps.
 * 
 * Constitution Principle II: Honest AI
 * - Shows warnings from parsing
 * - Displays confidence score
 */

import React, { useState, useCallback } from "react";
import { Plus, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepEditor } from "@/components/step-editor";
import { WorkoutChart } from "@/components/workout-chart";
import { useTranslation } from "@/lib/i18n";
import type { Workout, Step, StepType } from "@/lib/schemas";

// ============================================================================
// Types
// ============================================================================

interface WorkoutEditorProps {
  workout: Workout;
  warnings?: string[];
  confidence?: number;
  onChange: (workout: Workout) => void;
  className?: string;
}

// ============================================================================
// Default Steps for Adding
// ============================================================================

const DEFAULT_STEPS: Record<StepType, Step> = {
  warmup: {
    type: "warmup",
    duration_s: 300,
    power_start_pct: 50,
    power_end_pct: 75,
  },
  cooldown: {
    type: "cooldown",
    duration_s: 300,
    power_start_pct: 70,
    power_end_pct: 40,
  },
  steady: {
    type: "steady",
    duration_s: 600,
    power_pct: 75,
  },
  intervals: {
    type: "intervals",
    repeat: 5,
    on_duration_s: 60,
    off_duration_s: 60,
    on_power_pct: 100,
    off_power_pct: 50,
  },
  freeride: {
    type: "freeride",
    duration_s: 300,
  },
};

// ============================================================================
// Component
// ============================================================================

export function WorkoutEditor({
  workout,
  warnings = [],
  confidence,
  onChange,
  className,
}: WorkoutEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [stepsExpanded, setStepsExpanded] = useState(false);
  const t = useTranslation();

  const updateWorkout = (updates: Partial<Workout>) => {
    onChange({ ...workout, ...updates });
  };

  const updateStep = (index: number, step: Step) => {
    const newSteps = [...workout.steps];
    newSteps[index] = step;
    updateWorkout({ steps: newSteps });
  };

  const deleteStep = (index: number) => {
    const newSteps = workout.steps.filter((_, i) => i !== index);
    if (newSteps.length > 0) {
      updateWorkout({ steps: newSteps });
    }
  };

  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSteps = [...workout.steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    updateWorkout({ steps: newSteps });
  }, [workout.steps, updateWorkout]);

  // Drag and Drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      moveStep(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, moveStep]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const addStep = (type: StepType) => {
    updateWorkout({ steps: [...workout.steps, { ...DEFAULT_STEPS[type] }] });
  };

  // Calculate total duration
  const totalDuration = workout.steps.reduce((acc, step) => {
    if (step.type === "intervals") {
      return acc + (step.on_duration_s + step.off_duration_s) * step.repeat;
    }
    return acc + step.duration_s;
  }, 0);

  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("editWorkout")}</CardTitle>
          {confidence !== undefined && (
            <ConfidenceBadge confidence={confidence} />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {t("parsingWarnings")}
                </p>
                <ul className="mt-1 text-sm text-amber-600 dark:text-amber-300 space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Workout Name */}
        <div>
          <Label htmlFor="workout-name">{t("workoutName")}</Label>
          <Input
            id="workout-name"
            value={workout.name}
            onChange={(e) => updateWorkout({ name: e.target.value })}
            placeholder={t("workoutNamePlaceholder")}
            maxLength={100}
            className="mt-1"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="workout-description">{t("description")}</Label>
          <Input
            id="workout-description"
            value={workout.description || ""}
            onChange={(e) => updateWorkout({ description: e.target.value || undefined })}
            placeholder={t("descriptionPlaceholder")}
            className="mt-1"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong>{workout.steps.length}</strong> {t("steps")}
          </span>
          <span>•</span>
          <span>
            <strong>{formatTotalTime(totalDuration)}</strong> {t("total")}
          </span>
        </div>

        {/* Workout Chart */}
        {workout.steps.length > 0 && (
          <div className="border rounded-lg p-4 bg-card">
            <Label className="mb-3 block">{t("workoutPreview")}</Label>
            <WorkoutChart workout={workout} height={180} />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t("hoverTip")}
            </p>
          </div>
        )}

        {/* Steps - Collapsible */}
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={() => setStepsExpanded(!stepsExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left bg-muted/10"
          >
            <div className="flex items-center gap-2">
              <Label className="cursor-pointer">{t("workoutSteps")}</Label>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {workout.steps.length}
              </span>
            </div>
            {stepsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          
          {stepsExpanded && (
            <div className="p-4 space-y-3 border-t">
              {workout.steps.map((step, index) => (
                <StepEditor
                  key={`step-${index}-${step.type}`}
                  step={step}
                  index={index}
                  onChange={(s) => updateStep(index, s)}
                  onDelete={() => deleteStep(index)}
                  isDragging={draggedIndex === index}
                  isDragOver={dragOverIndex === index}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                />
              ))}

              {/* Add Step Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-muted-foreground mr-2 flex items-center">
                  <Plus className="h-4 w-4 mr-1" /> {t("add")}
                </span>
                {(Object.keys(DEFAULT_STEPS) as StepType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addStep(type)}
                    className="capitalize"
                  >
                    {t(type)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const t = useTranslation();
  
  let color = "bg-green-500/10 text-green-700 dark:text-green-400";
  if (confidence < 0.5) {
    color = "bg-red-500/10 text-red-700 dark:text-red-400";
  } else if (confidence < 0.8) {
    color = "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color)}>
      {percentage}% {t("confidence")}
    </span>
  );
}
