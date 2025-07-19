import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8053/api/:path*', // Proxy a la API del backend
      },
    ];
  },
};

export default withFlowbiteReact(nextConfig);