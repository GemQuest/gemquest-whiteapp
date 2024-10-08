/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/dbapi/:path*",
        destination: "http://0.0.0.0:3030/:path*", // Le serveur backend
      },
    ];
  },
};

export default nextConfig;
