import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        zlib: false,
      };
    }
    config.module.rules.push({
      test: /\.LICENSE\.txt$/,
      type: 'asset/source',
    });
    return config;
  },
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
