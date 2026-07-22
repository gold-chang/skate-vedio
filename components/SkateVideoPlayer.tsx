'use client';

import React, { useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  Maximize 
} from 'lucide-react';

interface SkateVideoPlayerProps {
  src: string;
  poster?: string;
}

export default function SkateVideoPlayer({ src, poster }: SkateVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // 재생 / 일시정지 토글
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 배속 변경 (1.0x -> 0.5x -> 0.25x)
  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // 프레임 단위 이동 (30fps 기준 약 0.033초)
  const stepFrame = (direction: 'prev' | 'next') => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    const frameTime = 1 / 30; // 30fps
    if (direction === 'next') {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + frameTime, duration);
    } else {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - frameTime, 0);
    }
  };

  // 프로그레스 바 조작
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // 전체화면
  const toggleFullScreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  // 음소거
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 00:00.00 형식 (밀리초까지 표기)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl group border border-slate-800">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-[9/16] object-cover cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
      />

      {/* 비디오 컨트롤러 하단 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col gap-3">
        
        {/* 타임라인 */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-[10px] font-mono text-slate-300 min-w-[55px] text-right">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* 버턴 컨트롤 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 bg-slate-800/80 hover:bg-orange-500 text-white rounded-full transition"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            {/* 프레임 이동 */}
            <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => stepFrame('prev')}
                className="p-1 text-slate-300 hover:text-white rounded transition"
                title="1프레임 뒤로"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[9px] text-slate-400 px-1 font-semibold">FRAME</span>
              <button
                onClick={() => stepFrame('next')}
                className="p-1 text-slate-300 hover:text-white rounded transition"
                title="1프레임 앞으로"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 배속 버튼 (1x, 0.5x, 0.25x) */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 gap-1 border border-slate-700">
            {[1.0, 0.5, 0.25].map((rate) => (
              <button
                key={rate}
                onClick={() => changeSpeed(rate)}
                className={`px-2 py-0.5 text-xs font-bold rounded transition ${
                  playbackRate === rate
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rate === 1.0 ? '1x' : `${rate}x`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="p-1 text-slate-400 hover:text-white">
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={toggleFullScreen} className="p-1 text-slate-400 hover:text-white">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
