'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: '스클립 (SKClip)',
      text: '스클립, 스케이트 트릭을 볼 수 있는 곳',
      url: window.location.href,
    };

    // 모바일 브라우저의 공유창 지원 여부 확인 (카카오톡, 메시지 등)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // 사용자가 공유창을 취소한 경우 예외 처리
        console.log('공유 취소:', err);
      }
    } else {
      // 공유창 미지원 시 클립보드에 링크 복사
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        alert('링크가 클립보드에 복사되었습니다!');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        alert('링크 복사에 실패했습니다.');
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 text-[11px] bg-white border border-[#e8e2d8] text-[#6e6355] hover:text-[#3d332a] px-3 py-1.5 rounded-full transition shadow-2xs font-medium active:scale-95"
      title="공유하기"
    >
      {copied ? <Check size={13} className="text-green-600" /> : <Share2 size={13} />}
      <span>공유</span>
    </button>
  );
}
