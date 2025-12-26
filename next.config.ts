import type { NextConfig } from "next";

/**
 * Parse allowed dev origins from environment variable
 * Defaults to localhost if not configured
 */
const getAllowedDevOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_DEV_ORIGINS;
  if (envOrigins) {
    return envOrigins.split(",").map((origin) => origin.trim()).filter(Boolean);
  }
  return ["127.0.0.1", "localhost"];
};

/**
 * Get allowed origins for CORS in production
 * Returns undefined if not configured (no CORS headers)
 */
const getAllowedProdOrigins = (): string | undefined => {
  return process.env.ALLOWED_PROD_ORIGINS;
};

const nextConfig: NextConfig = {
  // Dev origins (only applies to `next dev`)
  allowedDevOrigins: getAllowedDevOrigins(),
  
  // Production CORS headers
  async headers() {
    const prodOrigins = getAllowedProdOrigins();
    
    // Skip CORS headers if not configured
    if (!prodOrigins) {
      return [];
    }
    
    return [
      {
        // Apply to API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: prodOrigins,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
