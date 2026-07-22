export const dynamic = 'force-dynamic';

import { supabase } from '../lib/supabase';
import { Settings, Trophy, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import VideoGrid from '../components/VideoGrid';

interface PageProps {
  searchParams: Promise<{ spot?: string; trick?: string; rider?: string; type?: string; sort?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const filterSpot = params.spot;
  const filterTrick = params.trick;
  const filterRider = params.rider;
  const filterType = params.type;
  const sortType = params.sort || 'likes';

  let orderByField = sortType === 'recent' ? 'created_at' : 'likes';

  // 초기 20개 가져오기
  const { data: rawVideos } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      video_url,
      likes,
      created_at,
      riders ( name, instagram, rider_type ),
      spots ( name, location_name ),
      tricks ( name, difficulty ),
      video_tricks ( tricks ( name, difficulty ) )
    `)
    .order(orderByField, { ascending: false })
    .range(0, 19);

  const allVideos = (rawVideos || []).map((v: any) => {
    let multiTricks: any[] = [];
    if (v.video_tricks && Array.isArray(v.video_tricks) && v.video_tricks.length > 0) {
      multiTricks = v.video_tricks.map((vt: any) => vt?.tricks).filter(Boolean);
    }
    if (multiTricks.length === 0 && v.tricks) {
      multiTricks = Array.isArray(v.tricks) ? v.tricks : [v.tricks];
    }
    return { ...v, tricksList: multiTricks };
  });

  const sampleSpots = Array.from(new Set(allVideos.map((v: any) => (Array.isArray(v.spots) ? v.spots[0]?.name : v.spots?.name)).filter(Boolean))).slice(0, 3);
  const sampleTricks = Array.from(new Set(allVideos.flatMap((v: any) => v.tricksList.map((t: any) => t?.name)).filter(Boolean))).slice(0, 4);
  const sampleRiders = Array.from(new Set(allVideos.map((v: any) => (Array.isArray(v.riders) ? v.riders[0]?.name : v.riders?.name)).filter(Boolean))).slice(0, 4);

  const filteredVideos = allVideos.filter((v: any) => {
    const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
    const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
    const tricks = v.tricksList || [];

    if (filterType && rider?.rider_type !== filterType) return false;
    if (filterSpot && spot?.name !== filterSpot) return false;
    if (filterTrick && !tricks.some((t: any) => t?.name === filterTrick)) return false;
    if (filterRider && rider?.name !== filterRider) return false;
    return true;
  });

  const getSortUrl = (newSort: string) => {
    const base = new URLSearchParams();
    if (filterSpot) base.set('spot', filterSpot);
    if (filterTrick) base.set('trick', filterTrick);
    if (filterRider) base.set('rider', filterRider);
    if (filterType) base.set('type', filterType);
    base.set('sort', newSort);
    return `/?${base.toString()}`;
  };

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-3 flex flex-col items-center justify-start max-w-md mx-auto pb-12 font-sans antialiased">
      {/* 헤더 */}
      <div className="w-full my-2 flex items-center justify-between">
        <span className="text-base font-black tracking-wide text-[#7a5c38]">
          🛹 스케이트보드 로그
        </span>
        <Link
          href="/admin"
          className="flex items-center gap-1 text-[11px] bg-white border border-[#e8e2d8] text-[#6e6355] hover:text-[#3d332a] px-3 py-1.5 rounded-full transition shadow-2xs font-medium"
        >
          <Settings size={13} /> 관리자
        </Link>
      </div>

      {/* 필터 영역 */}
      <section className="w-full mb-3 flex flex-col gap-2.5 bg-white border border-[#e8e2d8] p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8c8275]">카테고리 필터</span>
          {(filterSpot || filterTrick || filterRider || filterType) && (
            <Link href="/" className="text-[10px] text-[#a88963] font-bold hover:underline">
              필터 초기화
            </Link>
          )}
        </div>

        {/* 프로 전용 필터 */}
        <div className="flex items-center gap-2 border-b border-[#f0ebd9] pb-2">
          <Link
            href={filterType === '프로' ? '/' : '/?type=프로'}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full transition border ${
              filterType === '프로'
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                : 'bg-[#f0ebd9] text-[#7a5c38] border-[#e4ddc7] hover:bg-[#e4ddc7]'
            }`}
          >
            <Trophy size={12} />
            <span>🏆 프로 영상만 보기</span>
          </Link>
        </div>

        {/* 샘플 필터 칩 목록 (스팟 / 기술 / 보더) */}
        <div className="flex flex-col gap-1.5">
          {sampleSpots.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">스팟</span>
              {sampleSpots.map((spotName: any) => (
                <Link
                  key={spotName}
                  href={`/?spot=${encodeURIComponent(spotName)}`}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition border ${
                    filterSpot === spotName
                      ? 'bg-[#3d332a] text-white border-[#3d332a]'
                      : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  📍 {spotName}
                </Link>
              ))}
            </div>
          )}

          {sampleTricks.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">기술</span>
              {sampleTricks.map((trickName: any) => (
                <Link
                  key={trickName}
                  href={`/?trick=${encodeURIComponent(trickName)}`}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition border ${
                    filterTrick === trickName
                      ? 'bg-[#3d332a] text-white border-[#3d332a]'
                      : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  🛹 {trickName}
                </Link>
              ))}
            </div>
          )}

          {/* 🚀 복구된 보더(스케이터) 필터 라인 */}
          {sampleRiders.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-[#a09587] font-bold mr-0.5">보더</span>
              {sampleRiders.map((riderName: any) => (
                <Link
                  key={riderName}
                  href={`/?rider=${encodeURIComponent(riderName)}`}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition border ${
                    filterRider === riderName
                      ? 'bg-[#3d332a] text-white border-[#3d332a]'
                      : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                  }`}
                >
                  👤 {riderName}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 정렬 탭 */}
      <div className="w-full flex items-center gap-2 mb-3">
        <Link
          href={getSortUrl('likes')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition border ${
            sortType === 'likes'
              ? 'bg-white border-[#a88963] text-[#7a5c38] shadow-2xs'
              : 'bg-[#f0ebd9]/50 border-transparent text-[#8c8275]'
          }`}
        >
          <TrendingUp size={13} className={sortType === 'likes' ? 'text-[#a88963]' : ''} />
          인기순
        </Link>
        <Link
          href={getSortUrl('recent')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-bold transition border ${
            sortType === 'recent'
              ? 'bg-white border-[#a88963] text-[#7a5c38] shadow-2xs'
              : 'bg-[#f0ebd9]/50 border-transparent text-[#8c8275]'
          }`}
        >
          <Clock size={13} className={sortType === 'recent' ? 'text-[#a88963]' : ''} />
          최신순
        </Link>
      </div>

      {/* 2열 그리드 영상 목록 */}
      <section className="w-full">
        <VideoGrid
          initialVideos={filteredVideos}
          filterSpot={filterSpot}
          filterTrick={filterTrick}
          filterRider={filterRider}
          filterType={filterType}
          sortType={sortType}
        />
      </section>
    </main>
  );
}
