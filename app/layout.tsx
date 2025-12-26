import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { SettingsProvider } from "@/lib/settings";

export const metadata: Metadata = {
  title: "ImageToFit - Workout Image to ZWO Converter",
  description: "Transform cycling workout images into .zwo files for Zwift, Intervals.icu, and TrainingPeaks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <I18nProvider>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
