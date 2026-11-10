// URLs de los microservicios (vienen de .env.local; si no existen, se usan las de local)
const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL ?? "http://localhost:8081";
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL ?? "http://localhost:8082";

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            { source: "/api/tokens", destination: `${CLIENT_SERVICE_URL}/tokens` },
            { source: "/api/clients/:path*", destination: `${CLIENT_SERVICE_URL}/clients/:path*` },
            { source: "/api/merchants/:path*", destination: `${MERCHANT_SERVICE_URL}/merchants/:path*` }
        ];
    },
};
export default nextConfig;
