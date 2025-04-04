
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: ['img.youtube.com'],
//   },
// };

// module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["img.youtube.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/vi/**", // Allow all YouTube thumbnails
      },
    ],
  },
};

module.exports = nextConfig;
