/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-b08bf38fc53d48559fedbd81c16c9432.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
  distDir: "dist",
};

export default nextConfig;
