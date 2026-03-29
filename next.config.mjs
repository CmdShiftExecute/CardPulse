/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    instrumentationHook: true,
    outputFileTracingIncludes: {
      "/**": ["./data/**"],
    },
  },
};

export default nextConfig;
