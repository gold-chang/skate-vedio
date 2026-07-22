export const dynamic = 'force-dynamic';

import { supabase } from '../lib/supabase';
import { Settings, Play, Calendar, Heart } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ spot?: string; trick?: string; rider?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterSpot = params.spot;
  const filterTrick = params.trick;
  const filterRider = params.rider;

  const { data: videos } = await supabase
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
    .order('likes', { ascending: false });

  const allVideos = videos || [];

  const sampleSpots = Array.from(new Set(allVideos.map((v: any) => (Array.isArray(v.spots) ? v.spots[0]?.name : v.spots?.name)).filter(Boolean))).slice(0, 3);
  const sampleTricks = Array.from(new Set(allVideos.map((v: any) => (Array.isArray(v.tricks) ? v.tricks[0]?.name : v.tricks?.name)).filter(Boolean))).slice(0, 3);
  const sampleRiders = Array.from(new Set(allVideos.map((v: any) => (Array.isArray(v.riders) ? v.riders[0]?.name : v.riders?.name)).filter(Boolean))).slice(0, 3);

  const filteredVideos = allVideos.filter((v: any) => {
    const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
    const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
    const trick = Array.isArray(v.tricks) ? v.tricks[0] : v.tricks;

    if (filterSpot && spot?.name !== filterSpot) return false;
    if (filterTrick && trick?.name !== filterTrick) return false;
    if (filterRider && rider?.name !== filterRider) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col items-center justify-start max-w-md mx-auto pb-12 font-sans antialiased">
      {/* 헤더 */}
      <div className="w-full my-3 flex items-center justify-between">
        <span className="text-sm font-black tracking-wider text-[#7a5c38] uppercase">
          🛹 SKATE ARCHIVE
        </span>
        <Link
          href="/admin"
          className="flex items-center gap-1 text-[11px] bg-white border border-[#e8e2d8] text-[#6e6355] hover:text-[#3d332a] px-3 py-1.5 rounded-full transition shadow-sm font-medium"
        >
          <Settings size={13} /> 관리자
        </Link>
      </div>

      {/* 필터 영역 */}
      <section className="w-full mb-5 flex flex-col gap-3 bg-white border border-[#e8e2d8] p-4 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8c8275]">빠른 샘플 필터</span>
          {(filterSpot || filterTrick || filterRider) && (
            <Link href="/" className="text-[11px] text-[#a88963] font-bold hover:underline">
              필터 초기화
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {sampleSpots.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">스팟</span>
              {sampleSpots.map((spotName: any) => (
                <Link
                  key={spotName}
                  href={`/?spot=${encodeURIComponent(spotName)}`}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                    filterSpot === spotName
                      ? 'bg-[#3d332a] text-white'
                      : 'bg-[#f7f4ef] text-[#544a3e] border border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  📍 {spotName}
                </Link>
              ))}
            </div>
          )}

          {sampleTricks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">기술</span>
              {sampleTricks.map((trickName: any) => (
                <Link
                  key={trickName}
                  href={`/?trick=${encodeURIComponent(trickName)}`}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                    filterTrick === trickName
                      ? 'bg-[#3d332a] text-white'
                      : 'bg-[#f7f4ef] text-[#544a3e] border border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  🛹 {trickName}
                </Link>
              ))}
            </div>
          )}

          {sampleRiders.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">보더</span>
              {sampleRiders.map((riderName: any) => (
                <Link
                  key={riderName}
                  href={`/?rider=${encodeURIComponent(riderName)}`}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition ${
                    filterRider === riderName
                      ? 'bg-[#3d332a] text-white'
                      : 'bg-[#f7f4ef] text-[#544a3e] border border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  👤 {riderName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 영상 카드 목록 */}
      <section className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#8c8275]">🔥 인기 영상 순 ({filteredVideos.length})</h2>
        </div>

        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredVideos.map((item: any) => {
              const r = Array.isArray(item.riders) ? item.riders[0] : item.riders;
              const s = Array.isArray(item.spots) ? item.spots[0] : item.spots;
              const t = Array.isArray(item.tricks) ? item.tricks[0] : item.tricks;

              const dateStr = item.created_at
                ? new Date(item.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                : '';

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#e8e2d8] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  {/* 영상 썸네일 영역 */}
                  <Link href={`/video/${item.id}`} className="relative aspect-video bg-[#221e1a] group block overflow-hidden">
                    <video
                      src={`${item.video_url}#t=0.1`}
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 text-[#3d332a] rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-md backdrop-blur-sm">
                        <Play size={22} className="ml-0.5 fill-[#3d332a]" />
                      </div>
                    </div>

                    {/* 좋아요 배지 */}
                    <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/40 flex items-center gap-1 text-[#e04f5f] text-xs font-bold shadow-sm">
                      <Heart size={12} className="fill-[#e04f5f]" />
                      <span>{item.likes || 0}</span>
                    </div>
                  </Link>

                  {/* 메타 정보 */}
                  <div className="p-4 flex flex-col gap-2.5">
                    <Link href={`/video/${item.id}`} className="text-sm font-bold text-[#2c2825] hover:text-[#7a5c38] leading-snug line-clamp-1">
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/?spot=${encodeURIComponent(s?.name || '')}`}
                        className="text-[10px] bg-[#f7f4ef] text-[#6e6355] px-2.5 py-1 rounded-lg border border-[#e8e2d8] font-medium"
                      >
                        📍 {s?.name}
                      </Link>
                      <Link
                        href={`/?trick=${encodeURIComponent(t?.name || '')}`}
                        className="text-[10px] bg-[#f7f4ef] text-[#6e6355] px-2.5 py-1 rounded-lg border border-[#e8e2d8] font-medium"
                      >
                        🛹 {t?.name}
                      </Link>
                      <Link
                        href={`/?rider=${encodeURIComponent(r?.name || '')}`}
                        className="text-[10px] bg-[#f7f4ef] text-[#6e6355] px-2.5 py-1 rounded-lg border border-[#e8e2d8] font-medium"
                      >
                        👤 {r?.name}
                      </Link>

                      {dateStr && (
                        <span className="text-[10px] text-[#a09587] font-mono ml-auto flex items-center gap-0.5">
                          <Calendar size={10} /> {dateStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-[#8c8275] text-xs">등록된 영상이 없거나 조건에 맞는 결과가 없습니다.</div>
        )}
      </section>
    </main>
  );
}
