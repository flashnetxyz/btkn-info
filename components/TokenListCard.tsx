"use client";

import Link from "next/link";
import Image from "next/image";
import { parseTokenURI } from "@/lib/utils";
import { useState } from "react";

interface TokenListCardProps {
  name: string;
  url: string;
  homepage: string;
  tokensCount?: number | null;
  logoURI?: string;
}

export function TokenListCard({
  name,
  url,
  homepage,
  tokensCount,
  logoURI,
}: TokenListCardProps) {
  const [bgColor, setBgColor] = useState<string | undefined>();

  // Extract the average color from the loaded image to create a seamless banner background.
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
    } catch (err) {
      // Ignore CORS / security errors – fallback colour will be used.
    }
  };

  return (
    <Link
      href={`/token-list?url=${encodeURIComponent(url)}`}
      className="block rounded-lg border border-[#222222] bg-[#1A1A1A] overflow-hidden group">
      <div
        className="h-36 bg-primary flex items-center justify-center relative"
        style={bgColor ? { backgroundColor: bgColor } : undefined}>
        {logoURI && (
          <Image
            src={parseTokenURI(logoURI)}
            alt={`${name} logo`}
            width={64}
            height={64}
            className="rounded-md transition-transform group-hover:scale-105"
            onLoadingComplete={handleImageLoaded}
            crossOrigin="anonymous"
            quality={100}
          />
        )}
      </div>
      <div className="p-4 space-y-1.5">
        <h3 className="font-sans font-normal text-white">{name}</h3>
        <p className="font-sans font-normal text-sm text-[#8A8A8A]">
          {tokensCount?.toLocaleString() ?? 0} tokens
        </p>
      </div>
    </Link>
  );
}
