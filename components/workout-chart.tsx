"use client";

/**
 * WorkoutChart Component
 * 
 * Visual representation of a workout with colored bars by power zone.
 * Similar to Intervals.icu, TrainingPeaks, and Zwift workout views.
 * 
 * Constitution Principle IV: Mobile-First UX
 * - Responsive chart that works on all screen sizes
 * - Touch-friendly with clear visual hierarchy
 */

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Workout, Step } from "@/lib/schemas";

// ============================================================================
// Types
// ============================================================================

interface WorkoutChartProps {
  workout: Workout;
  className?: string;
  showTimeAxis?: boolean;
  showPowerAxis?: boolean;
  height?: number;
}

interface ChartSegment {
  startTime: number;
  duration: number;
  powerStart: number;
  powerEnd: number;
  type: Step["type"];
  label?: string;
}

// ============================================================================
// Power Zone Colors (based on % FTP)
// ============================================================================

function getPowerZoneColor(power: number): string {
  // Power is in decimal (0.55 = 55%)
  const percent = power * 100;
  
  if (percent <= 55) return "rgb(134, 199, 143)"; // Zone 1 - Recovery (light green)
  if (percent <= 75) return "rgb(85, 178, 151)";  // Zone 2 - Endurance (teal)
  if (percent <= 90) return "rgb(255, 205, 86)";  // Zone 3 - Tempo (yellow)
  if (percent <= 105) return "rgb(255, 159, 64)"; // Zone 4 - Threshold (orange)
  if (percent <= 120) return "rgb(255, 99, 71)";  // Zone 5 - VO2max (red-orange)
  return "rgb(220, 53, 69)";                       // Zone 6+ - Anaerobic (red)
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatDurationShort(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${minutes}min`;
  return `${minutes}m${secs}s`;
}

function stepToSegments(step: Step, startTime: number): ChartSegment[] {
  const segments: ChartSegment[] = [];
  
  switch (step.type) {
    case "warmup":
      segments.push({
        startTime,
        duration: step.duration_s,
        powerStart: step.power_start_pct / 100,
        powerEnd: step.power_end_pct / 100,
        type: "warmup",
      });
      break;
      
    case "cooldown":
      segments.push({
        startTime,
        duration: step.duration_s,
        powerStart: step.power_start_pct / 100,
        powerEnd: step.power_end_pct / 100,
        type: "cooldown",
      });
      break;
      
    case "steady":
      segments.push({
        startTime,
        duration: step.duration_s,
        powerStart: step.power_pct / 100,
        powerEnd: step.power_pct / 100,
        type: "steady",
      });
      break;
      
    case "intervals": {
      let currentTime = startTime;
      for (let i = 0; i < step.repeat; i++) {
        // Work interval
        segments.push({
          startTime: currentTime,
          duration: step.on_duration_s,
          powerStart: step.on_power_pct / 100,
          powerEnd: step.on_power_pct / 100,
          type: "intervals",
          label: `${i + 1}/${step.repeat}`,
        });
        currentTime += step.on_duration_s;
        
        // Rest interval
        segments.push({
          startTime: currentTime,
          duration: step.off_duration_s,
          powerStart: step.off_power_pct / 100,
          powerEnd: step.off_power_pct / 100,
          type: "intervals",
        });
        currentTime += step.off_duration_s;
      }
      break;
    }
      
    case "freeride":
      segments.push({
        startTime,
        duration: step.duration_s,
        powerStart: 0.5, // Default display for freeride
        powerEnd: 0.5,
        type: "freeride",
      });
      break;
  }
  
  return segments;
}

// ============================================================================
// Component
// ============================================================================

export function WorkoutChart({
  workout,
  className,
  showTimeAxis = true,
  showPowerAxis = true,
  height = 200,
}: WorkoutChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Convert workout steps to chart segments
  const { segments, totalDuration, maxPower } = useMemo(() => {
    const allSegments: ChartSegment[] = [];
    let currentTime = 0;
    let maxP = 0;
    
    for (const step of workout.steps) {
      const stepSegments = stepToSegments(step, currentTime);
      allSegments.push(...stepSegments);
      
      for (const seg of stepSegments) {
        currentTime = seg.startTime + seg.duration;
        maxP = Math.max(maxP, seg.powerStart, seg.powerEnd);
      }
    }
    
    return {
      segments: allSegments,
      totalDuration: currentTime,
      maxPower: Math.max(maxP, 1.2), // At least 120% for scale
    };
  }, [workout.steps]);

  // Generate time axis labels
  const timeLabels = useMemo(() => {
    const labels: { time: number; label: string }[] = [];
    const interval = totalDuration > 3600 ? 600 : totalDuration > 1800 ? 300 : 120; // 10min, 5min, or 2min
    
    for (let t = 0; t <= totalDuration; t += interval) {
      labels.push({ time: t, label: formatTime(t) });
    }
    
    // Always include end time
    if (labels[labels.length - 1]?.time !== totalDuration) {
      labels.push({ time: totalDuration, label: formatTime(totalDuration) });
    }
    
    return labels;
  }, [totalDuration]);

  // Generate power axis labels
  const powerLabels = useMemo(() => {
    const labels: { power: number; label: string }[] = [];
    const maxPercent = Math.ceil(maxPower * 100 / 25) * 25; // Round up to nearest 25%
    
    for (let p = 0; p <= maxPercent; p += 25) {
      labels.push({ power: p / 100, label: `${p}%` });
    }
    
    return labels;
  }, [maxPower]);

  const chartHeight = height - (showTimeAxis ? 30 : 0);
  const chartPadding = showPowerAxis ? 45 : 10;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative" style={{ height }}>
        {/* Power axis */}
        {showPowerAxis && (
          <div 
            className="absolute left-0 top-0 flex flex-col justify-between text-xs text-muted-foreground"
            style={{ height: chartHeight, width: chartPadding - 5 }}
          >
            {powerLabels.reverse().map(({ power, label }) => (
              <span key={power} className="text-right pr-1">
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Chart area */}
        <div 
          className="absolute bg-muted/30 rounded overflow-hidden"
          style={{ 
            left: chartPadding, 
            right: 10, 
            top: 0, 
            height: chartHeight 
          }}
        >
          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full">
            {/* Horizontal grid lines */}
            {powerLabels.map(({ power }) => {
              const y = chartHeight - (power / maxPower) * chartHeight;
              return (
                <line
                  key={power}
                  x1="0"
                  y1={y}
                  x2="100%"
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={power === 1 ? 0.3 : 0.1}
                  strokeDasharray={power === 1 ? "4,4" : undefined}
                  className="text-muted-foreground"
                />
              );
            })}
          </svg>

          {/* Workout segments */}
          <div className="relative w-full h-full flex">
            {segments.map((segment, index) => {
              const widthPercent = (segment.duration / totalDuration) * 100;
              const startHeightPercent = (segment.powerStart / maxPower) * 100;
              const endHeightPercent = (segment.powerEnd / maxPower) * 100;
              const avgPower = (segment.powerStart + segment.powerEnd) / 2;
              const color = segment.type === "freeride" 
                ? "rgb(156, 163, 175)" 
                : getPowerZoneColor(avgPower);
              
              // For ramp segments (warmup/cooldown), use gradient
              const isRamp = segment.powerStart !== segment.powerEnd;

              const handleMouseEnter = (e: React.MouseEvent) => {
                setHoveredSegment(index);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
              };

              const handleMouseLeave = () => {
                setHoveredSegment(null);
                setTooltipPos(null);
              };

              const handleTouchStart = (e: React.TouchEvent) => {
                setHoveredSegment(index);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
              };
              
              return (
                <div
                  key={index}
                  className="relative h-full cursor-pointer"
                  style={{ width: `${widthPercent}%` }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleMouseLeave}
                >
                  {isRamp ? (
                    // Ramp with gradient (warmup/cooldown)
                    <svg 
                      className={cn(
                        "absolute bottom-0 w-full transition-opacity",
                        hoveredSegment === index ? "opacity-80" : ""
                      )}
                      style={{ height: `${Math.max(startHeightPercent, endHeightPercent)}%` }}
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100"
                    >
                      <defs>
                        <linearGradient id={`grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={getPowerZoneColor(segment.powerStart)} />
                          <stop offset="100%" stopColor={getPowerZoneColor(segment.powerEnd)} />
                        </linearGradient>
                      </defs>
                      <polygon
                        points={`0,${100 - (startHeightPercent / Math.max(startHeightPercent, endHeightPercent)) * 100} 100,${100 - (endHeightPercent / Math.max(startHeightPercent, endHeightPercent)) * 100} 100,100 0,100`}
                        fill={`url(#grad-${index})`}
                      />
                    </svg>
                  ) : (
                    // Flat segment (steady/intervals)
                    <div
                      className={cn(
                        "absolute bottom-0 w-full transition-all",
                        hoveredSegment === index ? "opacity-80 ring-2 ring-white ring-inset" : ""
                      )}
                      style={{
                        height: `${startHeightPercent}%`,
                        backgroundColor: color,
                        borderLeft: index > 0 ? "1px solid rgba(255,255,255,0.2)" : undefined,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {hoveredSegment !== null && tooltipPos && (
            <div 
              className="fixed z-50 pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 10,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="bg-foreground text-background text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                <div className="font-semibold capitalize mb-1">
                  {segments[hoveredSegment].type === "intervals" ? "Interval" : segments[hoveredSegment].type}
                </div>
                <div className="space-y-0.5">
                  <div>⏱️ {formatDurationShort(segments[hoveredSegment].duration)}</div>
                  {segments[hoveredSegment].powerStart === segments[hoveredSegment].powerEnd ? (
                    <div>⚡ {Math.round(segments[hoveredSegment].powerStart * 100)}% FTP</div>
                  ) : (
                    <div>⚡ {Math.round(segments[hoveredSegment].powerStart * 100)}% → {Math.round(segments[hoveredSegment].powerEnd * 100)}% FTP</div>
                  )}
                </div>
              </div>
              <div 
                className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1"
              />
            </div>
          )}

          {/* FTP line at 100% */}
          <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-foreground/40"
            style={{ bottom: `${(1 / maxPower) * 100}%` }}
          />
        </div>

        {/* Time axis */}
        {showTimeAxis && (
          <div 
            className="absolute bottom-0 flex justify-between text-xs text-muted-foreground"
            style={{ left: chartPadding, right: 10, height: 25 }}
          >
            {timeLabels.map(({ time, label }) => (
              <span 
                key={time} 
                className="transform -translate-x-1/2"
                style={{ position: "absolute", left: `${(time / totalDuration) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(134, 199, 143)" }} />
          <span>Z1 Recovery</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(85, 178, 151)" }} />
          <span>Z2 Endurance</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(255, 205, 86)" }} />
          <span>Z3 Tempo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(255, 159, 64)" }} />
          <span>Z4 Threshold</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "rgb(255, 99, 71)" }} />
          <span>Z5 VO2max</span>
        </div>
      </div>
    </div>
  );
}
