/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";

    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://pulse-stat.ramnivas.in"
      : "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://pulse-stat.ramnivas.in";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com",
              "img-src 'self' https: data: https://pulse-stat.ramnivas.in",
              "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
              "frame-src 'self' https://*.codesandbox.io https://*.sandpack.codesandbox.io",
              "connect-src 'self' https://api.codesandbox.io https://*.googleapis.com https://pulse-stat.ramnivas.in",
            ].join("; "),
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;