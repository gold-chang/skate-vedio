export const dynamic = 'force-dynamic';

import { supabase } from '../../../lib/supabase';
import SkateVideoPlayer from '../../../components/SkateVideoPlayer';
import LikeButton from '../../../components/LikeButton';
import { ArrowLeft, MessageCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: video } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      video_url,
      likes,
      created_at,
      riders ( name, instagram ),
      spots ( name, location_name ),
      tricks ( name, difficulty )
    `)
    .eq('id', id)
    .single();

  if (!video) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col items-center justify-center max-w-md mx-auto">
        <p className="text-[#8c8275] text-xs mb-4">영상을 찾을 수 없습니다.</p>
        <Link href="/" className="bg-[#3d332a] text-white px-4 py-2 rounded-xl text-xs font-bold">
          메인으로 돌아가기
        </Link>
      </main>
    );
  }

  const rider = Array.isArray(video.riders) ? video.riders[0] : video.riders;
  const spot = Array.isArray(video.spots) ? video.spots[0] : video.spots;
  const trick = Array.isArray(video.tricks) ? video.tricks[0] : video.tricks;

  const formattedDate = video.created_at
    ? new Date(video.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : '';

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col items-center justify-start max-w-md mx-auto pb-12 font-sans antialiased">
      {/* 뒤로가기 */}
      <div className="w-full my-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1 text-[#8c8275] text-xs font-semibold hover:text-[#3d332a] transition">
          <ArrowLeft size={16} /> 목록으로
        </Link>
        <span className="text-xs font-black tracking-wider text-[#7a5c38] uppercase">
          SKATE ARCHIVE
        </span>
      </div>

      {/* 정보 및 타이틀 */}
      <header className="w-full flex flex-col gap-2.5 mb-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-[#e8e2d8] text-[#544a3e] text-xs px-2.5 py-1 rounded-full font-semibold">
              📍 {spot?.name || '스팟'}
            </span>
            <span className="bg-[#e8e2d8] text-[#544a3e] text-xs px-2.5 py-1 rounded-full font-semibold">
              🛹 {trick?.name || '기술'}
            </span>
          </div>

          {formattedDate && (
            <span className="flex items-center gap-1 text-[11px] text-[#a09587] font-mono">
              <Calendar size={12} /> {formattedDate}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 mt-1">
          <h1 className="text-base font-bold text-[#2c2825] leading-snug flex-1">
            {video.title}
          </h1>
          <LikeButton videoId={video.id} initialLikes={video.likes || 0} />
        </div>
      </header>

      {/* 비디오 플레이어 */}
      <section className="w-full mb-4">
        <SkateVideoPlayer src={video.video_url || '/test.mp4'} />
      </section>

      {/* 스케이터 인스타 링크 카드리스트 */}
      <section className="w-full bg-white border border-[#e8e2d8] rounded-3xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] text-[#a09587] font-bold uppercase tracking-wider">SKATER</span>
          <h3 className="text-sm font-bold text-[#3d332a]">
            {rider?.name || '익명 스케이터'}
          </h3>
          {rider?.instagram && (
            <p className="text-xs text-[#7a5c38]">@{rider.instagram}</p>
          )}
        </div>

        {rider?.instagram && (
          <a
            href={`https://instagram.com/${rider.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-[#3d332a] hover:bg-[#2c231a] text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl transition shadow-sm active:scale-95"
          >
            <MessageCircle size={14} />
            <span>스케이터 인스타 링크</span>
          </a>
        )}
      </section>
    </main>
  );
}
