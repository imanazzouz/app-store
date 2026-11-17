/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native / server-only packages that must not be bundled by Next.js.
  serverExternalPackages: ['pg', '@electric-sql/pglite', '@vercel/blob'],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
