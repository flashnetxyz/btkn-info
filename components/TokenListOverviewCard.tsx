"use client";

import Image from "next/image";
import { useState } from "react";
import { parseTokenURI } from "@/lib/utils";

interface TokenListOverviewCardProps {
	name: string;
	url: string;
	homepage: string;
	tokensCount: number;
	logoURI?: string;
}

export default function TokenListOverviewCard({
	name,
	url,
	homepage,
	tokensCount,
	logoURI,
}: TokenListOverviewCardProps) {
	const [bgColor, setBgColor] = useState<string | undefined>();

	// Extract the average colour from the loaded image to match banner background.
	const handleImageLoaded = (img: HTMLImageElement) => {
		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			// Down-scale for perf. Using 16×16 gives 60 edge pixels.
			const w = 16;
			const h = 16;
			canvas.width = w;
			canvas.height = h;
			ctx.drawImage(img, 0, 0, w, h);

			const { data } = ctx.getImageData(0, 0, w, h);
			const rVals: number[] = [];
			const gVals: number[] = [];
			const bVals: number[] = [];

			const isEdge = (x: number, y: number) =>
				x === 0 || y === 0 || x === w - 1 || y === h - 1;

			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					if (!isEdge(x, y)) continue;
					const idx = (y * w + x) * 4;
					const alpha = data[idx + 3];
					if (alpha === 0) continue; // ignore transparent
					rVals.push(data[idx]);
					gVals.push(data[idx + 1]);
					bVals.push(data[idx + 2]);
				}
			}

			if (rVals.length === 0) return;

			const median = (arr: number[]) => {
				const sorted = arr.sort((a, b) => a - b);
				const mid = Math.floor(sorted.length / 2);
				return sorted.length % 2
					? sorted[mid]
					: Math.round((sorted[mid - 1] + sorted[mid]) / 2);
			};

			const medR = median(rVals);
			const medG = median(gVals);
			const medB = median(bVals);

			setBgColor(`rgb(${medR}, ${medG}, ${medB})`);
		} catch {
			// Ignore CORS / security errors; fallback colour will be used.
		}
	};

	return (
		<div className="bg-[#1A1A1A] border border-[#222222] rounded-lg overflow-hidden">
			<div
				className="h-36 flex items-center justify-center relative"
				style={bgColor ? { backgroundColor: bgColor } : undefined}
			>
				{logoURI && (
					<Image
						src={parseTokenURI(logoURI)}
						alt={`${name} logo`}
						width={64}
						height={64}
						className="rounded-md"
						onLoadingComplete={handleImageLoaded}
						crossOrigin="anonymous"
						quality={100}
					/>
				)}
			</div>
			<div className="p-6 space-y-3 text-sm">
				<h2 className="text-xl font-normal text-white">{name}</h2>
				<div className="space-y-1.5">
					<div>
						<span className="text-[#8A8A8A]">Source: </span>
						<a
							href={url}
							target="_blank"
							className="text-[#4DFF94] hover:underline break-all"
						>
							{url}
						</a>
					</div>
					<div>
						<span className="text-[#8A8A8A]">Homepage: </span>
						<a
							href={homepage}
							target="_blank"
							className="text-[#4DFF94] hover:underline break-all"
						>
							{homepage}
						</a>
					</div>
					<div>
						<span className="text-[#8A8A8A]">Tokens: </span>
						<span className="text-white">{tokensCount.toLocaleString()}</span>
					</div>
				</div>
			</div>
		</div>
	);
}
