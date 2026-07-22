'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface SkateVideoPlayerProps {
  src: string;
}

export default function SkateVideoPlayer({ src }: SkateVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  // 재생 / 일시정지
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 음소거 토글
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 처음부터 다시 재생
  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  // 비디오 재생 시간 업데이트 이벤트
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  // 타임라인 슬라이더 조작
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  return (
    <div className="relative w-full aspect-video bg-[#1f1b18] rounded-3xl overflow-hidden border border-[#e8e2d8] shadow-sm group">
      {/* 비디오 엘리먼트 */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        muted={isMuted}
        playsInline
      />

      {/* 비디오 중앙 재생/일시정지 오버레이 버튼 (마우스 오버 시 표시) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition duration-200"
        >
          <div className="w-14 h-14 bg-white/90 text-[#3d332a] rounded-full flex items-center justify-center shadow-lg transform transition group-hover:scale-105">
            <Play size={26} className="ml-1 fill-[#3d332a]" />
          </div>
        </button>
      )}

      {/* 비디오 하단 컨트롤러 바 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition">
        {/* 재생바 (타임라인) */}
        <input
          type="range"
          min="0"
          max="100"
          value={isNaN(progress) ? 0 : progress}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#a88963]"
        />

        {/* 하단 버튼들 */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-white/20 rounded-full transition"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-white/20 rounded-full transition text-white/80 hover:text-white"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
