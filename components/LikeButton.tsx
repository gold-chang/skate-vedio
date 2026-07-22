'use client';

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  videoId: number;
  initialLikes: number;
}

export default function LikeButton({ videoId, initialLikes }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    if (liked) return;
    const newLikes = likes + 1;
    setLikes(newLikes);
    setLiked(true);

    await supabase
      .from('videos')
      .update({ likes: newLikes })
      .eq('id', videoId);
  };

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition active:scale-95 shadow-sm ${
        liked
          ? 'bg-[#fce8e6] text-[#d9383a] border-[#f9c5c3]'
          : 'bg-white text-[#544a3e] border-[#e8e2d8] hover:border-[#dcd5cb]'
      }`}
    >
      <Heart size={14} className={liked ? 'fill-[#d9383a] text-[#d9383a]' : 'text-[#a09587]'} />
      <span>{likes}</span>
    </button>
  );
}
