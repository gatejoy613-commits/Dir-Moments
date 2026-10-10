/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  // Profile forms upload several phone photos at once; they are compressed on the server.
  experimental: { serverActions: { bodySizeLimit: "40mb" } },
  serverExternalPackages: ["sharp"],
};
export default nextConfig;
