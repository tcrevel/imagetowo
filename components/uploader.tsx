"use client";

/**
 * Uploader Component
 * 
 * Drag-and-drop image upload with preview.
 * Supports click to select and mobile camera capture.
 * 
 * Constitution Principle IV: Mobile-First UX
 * - Touch-friendly drop zone
 * - Camera capture on mobile
 * 
 * Constitution Principle V: Privacy by Default
 * - Images processed server-side only
 * - No client-side storage
 */

import React, { useCallback, useState, useRef } from "react";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

// ============================================================================
// Types
// ============================================================================

interface UploaderProps {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function Uploader({
  onUpload,
  isLoading = false,
  accept = "image/jpeg,image/png,image/webp",
  maxSizeMB = 10,
  className,
}: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslation();

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!accept.split(",").includes(file.type)) {
        return `Invalid file type. Please upload: ${accept.replace(/image\//g, "").toUpperCase()}`;
      }
      if (file.size > maxSizeBytes) {
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }
      return null;
    },
    [accept, maxSizeBytes, maxSizeMB]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      }
    },
    [validateFile, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  }, []);

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload workout image"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Take photo of workout"
      />

      {/* Preview or Drop Zone */}
      {preview ? (
        <div className="relative rounded-lg border-2 border-border overflow-hidden">
          <img
            src={preview}
            alt="Workout preview"
            className="w-full h-auto max-h-96 object-contain bg-muted"
          />
          {!isLoading && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={clearPreview}
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t("analyzing")}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
            "flex flex-col items-center justify-center gap-4 min-h-[200px]",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Upload
            className={cn(
              "h-12 w-12 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )}
          />
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? t("dropHere") : t("dropImage")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("maxSize")} {maxSizeMB}MB
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t("browse")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              {t("takePhoto")}
            </Button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
