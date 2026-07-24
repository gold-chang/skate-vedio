'use client';

import React from 'react';

interface SkateVideoPlayerProps {
  src?: string;
  videoUrl?: string;
}

export default function SkateVideoPlayer({ src, videoUrl }: SkateVideoPlayerProps) {
  const finalUrl = src || videoUrl || '';

  return (
    <div className="w-full relative rounded-2xl overflow-hidden bg-black aspect-[4/5] shadow-sm">
      <video
        src={finalUrl}
        controls
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
