import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},

	async rewrites() {
		return [
			{
				source: "/relay-znVB/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/relay-znVB/:path*",
				destination: "https://us.i.posthog.com/:path*",
			},
			{
				source: "/relay-znVB/flags",
				destination: "https://us.i.posthog.com/flags",
			},
		];
	},
	skipTrailingSlashRedirect: true,
};

export default nextConfig;
