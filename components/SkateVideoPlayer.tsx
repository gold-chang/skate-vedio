'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Repeat } from 'lucide-react';

interface SkateVideoPlayerProps {
  src?: string;
  videoUrl?: string;
}

export default function SkateVideoPlayer({ src, videoUrl }: SkateVideoPlayerProps) {
  const finalUrl = src || videoUrl || '';
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  
  // 비디오 시간 관리
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // 재생 속도 변경
  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

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

  // 반복 재생 토글
  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
    }
  };

  // 프레임 단위 이동 (1/30초 기준)
  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    
    const frameTime = 1 / 30;
    videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + frames * frameTime));
  };

  // 탐색 바 드래그 / 클릭 시 비디오 이동
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // 시간 업데이트 동기화
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // 메타데이터 로드 시 전체 시간 수집
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // 시간 포맷터 (예: 00:03)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 🎬 비디오 화면 + 우측 하단 플로팅 재생/일시정지 버튼 */}
      <div className="w-full relative rounded-3xl overflow-hidden bg-black aspect-[3/4] shadow-sm group">
        <video
          ref={videoRef}
          src={finalUrl}
          autoPlay
          loop={isLooping}
          muted
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* 🚀 영상 우측 하단 플로팅 재생/일시정지 버튼 */}
        <button
          type="button"
          onClick={togglePlay}
          className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white p-2.5 rounded-full border border-white/20 transition active:scale-90 cursor-pointer shadow-md flex items-center justify-center z-10"
        >
          {isPlaying ? (
            <Pause size={18} className="fill-white" />
          ) : (
            <Play size={18} className="fill-white ml-0.5" />
          )}
        </button>
      </div>

      {/* 🚀 빠른 구간 탐색 바 (Progress Bar) */}
      <div className="w-full bg-white border border-[#e8e2d8] px-3 py-2 rounded-xl flex items-center gap-2 shadow-2xs">
        <span className="text-[10px] font-mono text-[#8c8275] min-w-[32px]">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-[#f0ebd9] rounded-lg appearance-none cursor-pointer accent-[#3d332a]"
        />
        <span className="text-[10px] font-mono text-[#8c8275] min-w-[32px] text-right">
          {formatTime(duration)}
        </span>
      </div>

      {/* 🛠️ 하단 컨트롤러 칩 */}
      <div className="w-full bg-white border border-[#e8e2d8] p-2.5 rounded-2xl shadow-2xs flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {/* 속도 선택 칩 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleSpeedChange(1.0)}
            className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
              playbackRate === 1.0
                ? 'bg-[#3d332a] text-white border-[#3d332a]'
                : 'bg-[#f7f4ef] text-[#6e6355] border-[#e8e2d8] hover:bg-[#e8e2d8]'
            }`}
          >
            원본속도
          </button>
          <button
            type="button"
            onClick={() => handleSpeedChange(0.5)}
            className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
              playbackRate === 0.5
                ? 'bg-[#3d332a] text-white border-[#3d332a]'
                : 'bg-[#f7f4ef] text-[#6e6355] border-[#e8e2d8] hover:bg-[#e8e2d8]'
            }`}
          >
            느리게
          </button>
          <button
            type="button"
            onClick={() => handleSpeedChange(0.25)}
            className={`text-[10px] font-extrabold px-2 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
              playbackRate === 0.25
                ? 'bg-[#3d332a] text-white border-[#3d332a]'
                : 'bg-[#f7f4ef] text-[#6e6355] border-[#e8e2d8] hover:bg-[#e8e2d8]'
            }`}
          >
            매우 느리게
          </button>
        </div>

        {/* 살짝 뒤로, 살짝 앞으로, 재생/일시정지, 반복재생 */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            className="text-[10px] font-extrabold px-2 py-1 bg-[#f7f4ef] hover:bg-[#e8e2d8] border border-[#e8e2d8] text-[#3d332a] rounded-lg transition active:scale-95 cursor-pointer"
          >
            살짝 뒤로
          </button>

          <button
            type="button"
            onClick={() => stepFrame(1)}
            className="text-[10px] font-extrabold px-2 py-1 bg-[#f7f4ef] hover:bg-[#e8e2d8] border border-[#e8e2d8] text-[#3d332a] rounded-lg transition active:scale-95 cursor-pointer"
          >
            살짝 앞으로
          </button>

          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? '일시정지' : '재생'}
            className="p-1.5 bg-[#3d332a] text-white rounded-lg transition active:scale-90 cursor-pointer shadow-2xs ml-0.5"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5 fill-white" />}
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            title={isLooping ? '반복 재생 켜짐' : '반복 재생 끄기'}
            className={`p-1.5 rounded-lg border transition active:scale-90 cursor-pointer ${
              isLooping
                ? 'bg-amber-600/90 text-white border-amber-600'
                : 'bg-[#f7f4ef] text-[#a09587] border-[#e8e2d8]'
            }`}
          >
            <Repeat size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
