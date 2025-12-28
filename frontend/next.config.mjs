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
        hostname: "pub-875ccf591d5e436c8c8f404de11eae03.r2.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
  distDir: "dist",
};

export default nextConfig;
