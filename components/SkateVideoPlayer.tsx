 'use client';

import React, { useRef, useState } from 'react';
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

  // 속도 변경 처리
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

  // 프레임 단위 이동 (약 1/30초 기준)
  const stepFrame = (frames: number) => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);
    
    const frameTime = 1 / 30; // 30fps 기준
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + frames * frameTime);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* 🎬 비디오 화면 */}
      <div className="w-full relative rounded-3xl overflow-hidden bg-black aspect-[3/4] shadow-sm">
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
        />
      </div>

      {/* 🛠️ 비디오 하단 플레이 컨트롤 바 */}
      <div className="w-full bg-white border border-[#e8e2d8] p-2.5 rounded-2xl shadow-2xs flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {/* 좌측: 속도 선택 칩 */}
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

        {/* 우측: 살짝 뒤로, 살짝 앞으로 텍스트 버튼, 재생/일시정지, 반복재생 */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* 살짝 뒤로 이동 버튼 */}
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            className="text-[10px] font-extrabold px-2 py-1 bg-[#f7f4ef] hover:bg-[#e8e2d8] border border-[#e8e2d8] text-[#3d332a] rounded-lg transition active:scale-95 cursor-pointer"
          >
            살짝 뒤로
          </button>

          {/* 살짝 앞으로 이동 버튼 */}
          <button
            type="button"
            onClick={() => stepFrame(1)}
            className="text-[10px] font-extrabold px-2 py-1 bg-[#f7f4ef] hover:bg-[#e8e2d8] border border-[#e8e2d8] text-[#3d332a] rounded-lg transition active:scale-95 cursor-pointer"
          >
            살짝 앞으로
          </button>

          {/* 재생 / 일시정지 */}
          <button
            type="button"
            onClick={togglePlay}
            title={isPlaying ? '일시정지' : '재생'}
            className="p-1.5 bg-[#3d332a] text-white rounded-lg transition active:scale-90 cursor-pointer shadow-2xs ml-0.5"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5 fill-white" />}
          </button>

          {/* 반복 재생 */}
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
