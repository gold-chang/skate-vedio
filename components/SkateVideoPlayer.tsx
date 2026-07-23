'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react';

interface SkateVideoPlayerProps {
  src: string;
}

export default function SkateVideoPlayer({ src }: SkateVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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

  // 조금 뒤로 / 조금 앞으로 (약 1/30초 단위 미세 이동)
  const stepFrame = (direction: 'prev' | 'next') => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    setIsPlaying(false);

    const frameTime = 1 / 30; // 약 30fps 기준 1프레임
    if (direction === 'prev') {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - frameTime);
    } else {
      videoRef.current.currentTime = Math.min(
        videoRef.current.duration,
        videoRef.current.currentTime + frameTime
      );
    }
  };

  // 속도 칩 클릭 시 배속 변경 (1 = 원본, 0.5, 0.25)
  const handleRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // 타임라인 슬라이더 조작 시 재생 위치 이동
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = parseFloat(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // 초 단위를 00:00 포맷으로 변환
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${formattedMins}:${formattedSecs}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  return (
    <div className="relative w-full aspect-[3/4] bg-[#1a1715] rounded-3xl overflow-hidden border border-[#e8e2d8] shadow-sm flex flex-col justify-between group">
      {/* 비디오 영역 (aspect-[3/4] 세로 비율 유지) */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        <video
          ref={videoRef}
          src={src}
            autoPlay  // 🚀 자동 재생
            muted     // 🚀 모바일 자동 재생 정책을 위한 음소거 (필수)
            playsInline // 🚀 iOS에서 전체화면으로 튕기지 않고 재생되도록 설정
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* 일시정지 상태 오버레이 - 화면 덮지 않고 우하단 미니 버튼만 노출 */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute bottom-4 right-4 pointer-events-auto transition hover:scale-110 active:scale-95"
            title="재생하기"
          >
            <div className="w-12 h-12 bg-[#3d332a]/80 text-white rounded-full flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm">
              <Play size={20} className="ml-0.5 fill-white" />
            </div>
          </button>
        )}
      </div>

      {/* 하단 통합 컨트롤러 바 */}
      <div className="w-full bg-[#2a2420] border-t border-[#3d352e] p-3 flex flex-col gap-2.5 text-white flex-shrink-0">
        {/* 영상 전체 길이 타임라인 슬라이더 & 시간 표시 */}
        <div className="flex items-center gap-2.5 px-0.5">
          <span className="text-[10px] text-[#a09587] font-mono w-9 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-[#1a1715] rounded-lg appearance-none cursor-pointer accent-[#a88963]"
          />
          <span className="text-[10px] text-[#a09587] font-mono w-9">
            {formatTime(duration)}
          </span>
        </div>

        {/* 조작 버튼군 (재생, 미세 프레임 이동, 속도 칩) */}
        <div className="flex items-center justify-between">
          {/* 재생 / 일시정지 */}
          <button
            onClick={togglePlay}
            className="p-1.5 hover:bg-white/10 rounded-xl transition text-[#e8e2d8] hover:text-white"
            title={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current" />}
          </button>

          {/* 조금 뒤로 / 조금 앞으로 미세 컨트롤 */}
          <div className="flex items-center gap-1 bg-[#1a1715] px-2 py-1 rounded-2xl border border-[#3d352e]">
            <button
              onClick={() => stepFrame('prev')}
              className="flex items-center gap-0.5 text-[11px] font-medium text-[#c2bbb0] hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition"
              title="조금 뒤로"
            >
              <RotateCcw size={12} />
              <span>조금 뒤로</span>
            </button>
            <span className="text-[10px] text-[#7a6f63]">|</span>
            <button
              onClick={() => stepFrame('next')}
              className="flex items-center gap-0.5 text-[11px] font-medium text-[#c2bbb0] hover:text-white px-2 py-0.5 rounded-lg hover:bg-white/10 transition"
              title="조금 앞으로"
            >
              <span>조금 앞으로</span>
              <RotateCw size={12} />
            </button>
          </div>

          {/* 속도 조절 칩 (원본, 0.5, 0.25) */}
          <div className="flex items-center gap-1 bg-[#1a1715] p-1 rounded-2xl border border-[#3d352e]">
            {[
              { label: '원본', value: 1 },
              { label: '0.5', value: 0.5 },
              { label: '0.25', value: 0.25 },
            ].map((chip) => {
              const isActive = playbackRate === chip.value;
              return (
                <button
                  key={chip.value}
                  onClick={() => handleRateChange(chip.value)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-xl transition ${
                    isActive
                      ? 'bg-[#a88963] text-white shadow-sm'
                      : 'text-[#a09587] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
