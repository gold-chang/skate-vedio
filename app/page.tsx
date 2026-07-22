export const dynamic = 'force-dynamic';

import { supabase } from '../lib/supabase';
import SkateVideoPlayer from '../components/SkateVideoPlayer';
import { MessageCircle } from 'lucide-react';

export default async function Home() {
  // DB 조회가 안 될 경우를 대비한 예비용(Fallback) 데이터
  const defaultVideo = {
    title: '뚝섬 렛지 노즈그라인드 완벽 분석 (미리보기)',
    video_url: '/test.mp4',
    rider_name: '김보더',
    rider_instagram: 'skater_kim',
    spot_name: '뚝섬 X-게임장',
    trick_name: '노즈그라인드'
  };

  // Supabase DB에서 비디오 목록 가져오기 (단순 전체 조회)
  const { data: videos, error } = await supabase.from('videos').select('*');

  if (error) {
    console.error('❌ Supabase 조회 에러:', error.message);
  }

  // DB 데이터가 성공적으로 있으면 첫 번째 비디오 사용, 없으면 defaultVideo 사용
  const hasDbData = videos && videos.length > 0;
  const currentVideo = hasDbData ? videos[0] : defaultVideo;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 flex flex-col items-center justify-start max-w-md mx-auto">
      {/* DB 연결 상태 안내 상태바 */}
      <div className="w-full mb-2 flex justify-end">
        {hasDbData ? (
          <span className="text-[10px] bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full font-bold border border-green-500/30">
            🟢 DB 연결 성공
          </span>
        ) : (
          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full font-bold border border-yellow-500/30">
            🟡 미리보기 모드 (DB 조회 중/실패)
          </span>
        )}
      </div>

      {/* 헤더 & 스팟/기술 태그 영역 */}
      <header className="w-full my-2 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-orange-500/20 text-orange-400 text-xs px-2.5 py-1 rounded-full font-bold border border-orange-500/30">
            📍 {currentVideo.spot_name || '뚝섬 X-게임장'}
          </span>
          <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-700">
            🛹 {currentVideo.trick_name || '노즈그라인드'}
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-100">
          {currentVideo.title}
        </h1>
      </header>

      {/* 비디오 플레이어 */}
      <section className="w-full mb-6">
        <SkateVideoPlayer src={currentVideo.video_url} />
      </section>

      {/* 라이더 프로필 & 코칭 요청 카드 */}
      <section className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rider</span>
            <h3 className="text-base font-bold text-slate-200">
              {currentVideo.rider_name}
            </h3>
            {currentVideo.rider_instagram && (
              <p className="text-xs text-orange-400">@{currentVideo.rider_instagram}</p>
            )}
          </div>

          {currentVideo.rider_instagram && (
            <a
              href={`https://instagram.com/${currentVideo.rider_instagram}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-lg"
            >
              <MessageCircle size={14} />
              <span>코칭/피드백 요청</span>
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
