import React from 'react';
import { BannerRow } from '../types';

interface ReferralCarouselProps {
  banners: BannerRow[];
}

export default function ReferralCarousel({ banners }: ReferralCarouselProps) {
  if (!banners || banners.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider px-1">Sugerencias para ti</h3>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar">
        {banners.map(banner => (
          <a
            key={banner.id}
            href={banner.data_accion}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[85%] shrink-0 snap-center rounded-2xl overflow-hidden relative bg-zinc-900 border border-zinc-800 block"
          >
            <div className="aspect-[2/1] relative">
              <img
                src={banner.imagen_url}
                alt={banner.titulo}
                className="w-full h-full object-cover"
              />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}