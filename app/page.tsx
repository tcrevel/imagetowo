"use client";

/**
 * ImageToFit Home Page
 * 
 * Main application flow:
 * 1. Upload workout image
 * 2. AI parses to structured workout
 * 3. Edit workout if needed
 * 4. Export as .zwo file
 */

import React, { useState, useCallback } from "react";
import { Download, Loader2, ArrowRight, Upload, Sparkles, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Uploader } from "@/components/uploader";
import { WorkoutEditor } from "@/components/workout-editor";
import { WorkoutMetrics } from "@/components/workout-metrics";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import type { Workout, ParseResponse } from "@/lib/schemas";

// ============================================================================
// Types
// ============================================================================

type AppState = "upload" | "loading" | "edit";

// ============================================================================
// Component
// ============================================================================

export default function Home() {
  const [state, setState] = useState<AppState>("upload");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle image upload and parsing
  const handleUpload = useCallback(async (file: File) => {
    setState("loading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/workouts/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok && !data.workout) {
        throw new Error(data.error || "Failed to parse workout");
      }

      const result = data as ParseResponse;
      setWorkout(result.workout);
      setWarnings(result.warnings);
      setConfidence(result.confidence);
      setState("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse workout");
      setState("upload");
    }
  }, []);

  // Handle ZWO export
  const handleExport = useCallback(async () => {
    if (!workout) return;

    setIsExporting(true);

    try {
      const response = await fetch("/api/workouts/export/zwo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workout }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export");
      }

      // Download the file
      const blob = await response.blob();
      const filename =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="(.+)"/)?.[1] || "workout.zwo";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
    } finally {
      setIsExporting(false);
    }
  }, [workout]);

  // Reset to upload state
  const handleReset = useCallback(() => {
    setState("upload");
    setWorkout(null);
    setWarnings([]);
    setConfidence(0);
    setError(null);
  }, []);

  const t = useTranslation();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t("appName")}</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {state === "edit" && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <Upload className="h-4 w-4 mr-2" />
                {t("newUpload")}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Hero Section - Only on upload state */}
        {state === "upload" && (
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("heroTitle")}
              <br />
              <span className="text-primary">{t("heroTitleHighlight")}</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              {t("heroDescription")}
            </p>
          </div>
        )}

        {/* Main Content */}
        {state === "upload" && (
          <div className="space-y-6">
            <Uploader onUpload={handleUpload} isLoading={false} />
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Features */}
            <div className="grid gap-4 sm:grid-cols-3 mt-12">
              <FeatureCard
                icon={<Upload className="h-5 w-5" />}
                title={t("featureUploadTitle")}
                description={t("featureUploadDesc")}
              />
              <FeatureCard
                icon={<Sparkles className="h-5 w-5" />}
                title={t("featureAITitle")}
                description={t("featureAIDesc")}
              />
              <FeatureCard
                icon={<Download className="h-5 w-5" />}
                title={t("featureExportTitle")}
                description={t("featureExportDesc")}
              />
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">{t("loadingTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("loadingSubtitle")}
            </p>
          </div>
        )}

        {state === "edit" && workout && (
          <div className="space-y-6">
            {/* Workout Metrics (TSS/IF) */}
            <WorkoutMetrics workout={workout} />

            <WorkoutEditor
              workout={workout}
              warnings={warnings}
              confidence={confidence}
              onChange={setWorkout}
            />

            {/* Export Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-2 border-primary/30 rounded-2xl p-8">
              {/* Background decoration */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
              
              <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold">{t("exportReady")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("exportReadyDesc")}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="group relative min-w-[240px] h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl hover:shadow-2xl hover:shadow-primary/25 hover:scale-105 transition-all duration-300 rounded-xl"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                      {t("exporting")}
                    </>
                  ) : (
                    <>
                      <Download className="h-6 w-6 mr-2 group-hover:animate-bounce" />
                      {t("downloadZwo")}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Import Instructions */}
            <ImportInstructions />

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            {t("footerTagline")}
          </p>
          <p className="mt-1">
            {t("footerCompatible")}
          </p>
        </div>
      </footer>
    </main>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg border bg-card">
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

function ImportInstructions() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const t = useTranslation();

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <h3 className="text-sm font-medium p-4 bg-muted/50 border-b">
        📖 {t("importTitle")}
      </h3>
      
      {/* Intervals.icu */}
      <div className="border-b last:border-b-0">
        <button
          onClick={() => toggleSection("intervals")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">📊</span>
            <span className="font-medium">Intervals.icu</span>
          </div>
          {openSection === "intervals" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openSection === "intervals" && (
          <div className="px-4 pb-4 text-sm space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>{t("intervalsStep1")} <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">intervals.icu <ExternalLink className="h-3 w-3" /></a></li>
              <li>{t("intervalsStep2")}</li>
              <li>{t("intervalsStep3")}</li>
              <li>{t("intervalsStep4")}</li>
              <li>{t("intervalsStep5")}</li>
              <li>{t("intervalsStep6")}</li>
            </ol>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-700 dark:text-blue-300">
              <strong>💡 {t("tip")} :</strong> {t("intervalsTip")}
            </div>
          </div>
        )}
      </div>

      {/* TrainingPeaks */}
      <div className="border-b last:border-b-0">
        <button
          onClick={() => toggleSection("trainingpeaks")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🏋️</span>
            <span className="font-medium">TrainingPeaks</span>
          </div>
          {openSection === "trainingpeaks" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openSection === "trainingpeaks" && (
          <div className="px-4 pb-4 text-sm space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>{t("tpStep1")} <a href="https://trainingpeaks.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">trainingpeaks.com <ExternalLink className="h-3 w-3" /></a></li>
              <li>{t("tpStep2")}</li>
              <li>{t("tpStep3")}</li>
              <li>{t("tpStep4")}</li>
              <li>{t("tpStep5")}</li>
              <li>{t("tpStep6")}</li>
            </ol>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-700 dark:text-amber-300">
              <strong>⚠️ {t("note")} :</strong> {t("tpNote")}
            </div>
          </div>
        )}
      </div>

      {/* Zwift */}
      <div>
        <button
          onClick={() => toggleSection("zwift")}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🚴</span>
            <span className="font-medium">Zwift</span>
          </div>
          {openSection === "zwift" ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {openSection === "zwift" && (
          <div className="px-4 pb-4 text-sm space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>{t("zwiftStep1")}
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li><strong className="text-foreground">Windows :</strong> <code className="bg-muted px-1 rounded text-xs">Documents\Zwift\Workouts\[{t("yourId")}]</code></li>
                  <li><strong className="text-foreground">Mac :</strong> <code className="bg-muted px-1 rounded text-xs">Documents/Zwift/Workouts/[{t("yourId")}]</code></li>
                </ul>
              </li>
              <li>{t("zwiftStep2")}</li>
              <li>{t("zwiftStep3")}</li>
              <li>{t("zwiftStep4")}</li>
            </ol>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-700 dark:text-green-300">
              <strong>✅ {t("tip")} :</strong> {t("zwiftTip")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
