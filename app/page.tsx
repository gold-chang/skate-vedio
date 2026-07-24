export const revalidate = 60;

import { supabase } from '@/lib/supabase';
import { Settings, Trophy, TrendingUp, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import VideoGrid from '@/components/VideoGrid';
import ShareButton from '@/components/ShareButton';

interface PageProps {
  searchParams: Promise<{ spot?: string; trick?: string; rider?: string; type?: string; sort?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const filterSpots = (params.spot && typeof params.spot === 'string') ? params.spot.split(',').filter(Boolean) : [];
  const filterTricks = (params.trick && typeof params.trick === 'string') ? params.trick.split(',').filter(Boolean) : [];
  const filterRiders = (params.rider && typeof params.rider === 'string') ? params.rider.split(',').filter(Boolean) : [];
  const filterType = params.type;
  const sortType = params.sort || 'likes';

  let orderByField = sortType === 'recent' ? 'created_at' : 'likes';

  const { data: rawVideos } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      video_url,
      likes,
      created_at,
      riders(name, rider_type),
      spots(name),
      tricks(name),
      video_tricks(tricks(name))
    `)
    .order(orderByField, { ascending: false })
    .range(0, 49);

  // 🚀 [핵심] tricksList가 절대 undefined가 되지 않도록 안전 가공
  const allVideos = (rawVideos || []).map((v: any) => {
    if (!v) return null;
    let multiTricks: any[] = [];
    if (v.video_tricks && Array.isArray(v.video_tricks) && v.video_tricks.length > 0) {
      multiTricks = v.video_tricks.map((vt: any) => vt?.tricks).filter(Boolean);
    }
    if (multiTricks.length === 0 && v.tricks) {
      multiTricks = Array.isArray(v.tricks) ? v.tricks : [v.tricks];
    }
    return { ...v, tricksList: multiTricks || [] };
  }).filter(Boolean);

  const spotCounts: { [key: string]: number } = {};
  const trickCounts: { [key: string]: number } = {};
  const riderCounts: { [key: string]: number } = {};

  allVideos.forEach((v: any) => {
    if (!v) return;
    const sName = Array.isArray(v.spots) ? v.spots[0]?.name : v.spots?.name;
    const rName = Array.isArray(v.riders) ? v.riders[0]?.name : v.riders?.name;
    const likes = v.likes || 1;

    if (sName) spotCounts[sName] = (spotCounts[sName] || 0) + likes;
    if (rName) riderCounts[rName] = (riderCounts[rName] || 0) + likes;

    const tList = Array.isArray(v.tricksList) ? v.tricksList : [];
    tList.forEach((t: any) => {
      if (t?.name) trickCounts[t.name] = (trickCounts[t.name] || 0) + likes;
    });
  });

  const sampleSpots = Object.keys(spotCounts).sort((a, b) => spotCounts[b] - spotCounts[a]).slice(0, 8);
  const sampleTricks = Object.keys(trickCounts).sort((a, b) => trickCounts[b] - trickCounts[a]).slice(0, 8);
  const sampleRiders = Object.keys(riderCounts).sort((a, b) => riderCounts[b] - riderCounts[a]).slice(0, 8);

  const getFilterUrl = (type: 'spot' | 'trick' | 'rider', value: string) => {
    const base = new URLSearchParams();
    
    let currentSpots = [...filterSpots];
    let currentTricks = [...filterTricks];
    let currentRiders = [...filterRiders];

    if (type === 'spot') {
      currentSpots = currentSpots.includes(value)
        ? currentSpots.filter((item) => item !== value)
        : [...currentSpots, value];
    } else if (type === 'trick') {
      currentTricks = currentTricks.includes(value)
        ? currentTricks.filter((item) => item !== value)
        : [...currentTricks, value];
    } else if (type === 'rider') {
      currentRiders = currentRiders.includes(value)
        ? currentRiders.filter((item) => item !== value)
        : [...currentRiders, value];
    }

    if (currentSpots.length > 0) base.set('spot', currentSpots.join(','));
    if (currentTricks.length > 0) base.set('trick', currentTricks.join(','));
    if (currentRiders.length > 0) base.set('rider', currentRiders.join(','));
    if (filterType) base.set('type', filterType);
    base.set('sort', sortType);

    return `/?${base.toString()}`;
  };

  const getSortUrl = (newSort: string) => {
    const base = new URLSearchParams();
    if (filterSpots.length > 0) base.set('spot', filterSpots.join(','));
    if (filterTricks.length > 0) base.set('trick', filterTricks.join(','));
    if (filterRiders.length > 0) base.set('rider', filterRiders.join(','));
    if (filterType) base.set('type', filterType);
    base.set('sort', newSort);
    return `/?${base.toString()}`;
  };

  const hasActiveFilter = filterSpots.length > 0 || filterTricks.length > 0 || filterRiders.length > 0 || Boolean(filterType);

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-3 flex flex-col items-center justify-start max-w-md mx-auto pb-12 font-sans antialiased">
      {/* 상단 헤더 */}
      <div className="w-full my-2 flex items-center justify-between">
        <Link href="/" className="flex items-center active:scale-95 transition">
          <Image
            src="/logo.png"
            alt="SKClip Logo"
            width={110}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
        
        <div className="flex items-center gap-1.5">
          <ShareButton />
          <Link
            href="/admin"
            className="flex items-center gap-1 text-[11px] bg-white border border-[#e8e2d8] text-[#6e6355] hover:text-[#3d332a] px-3 py-1.5 rounded-full transition shadow-2xs font-medium"
          >
            <Settings size={13} /> 관리자
          </Link>
        </div>
      </div>

      {/* 필터 영역 */}
      <section className="w-full mb-3 flex flex-col gap-2.5 bg-white border border-[#e8e2d8] p-3.5 rounded-2xl shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#8c8275]">카테고리 필터 (다중 선택)</span>
          {hasActiveFilter && (
            <Link
              href="/"
              className="flex items-center gap-1 bg-[#e04f5f] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-2xs hover:bg-[#c93d4d] transition active:scale-95"
            >
              <RotateCcw size={10} /> 필터 초기화
            </Link>
          )}
        </div>

        {/* 프로 전용 필터 */}
        <div className="flex items-center gap-2 border-b border-[#f0ebd9] pb-2">
          <Link
            href={filterType === '프로' ? '/' : `/?type=프로${sortType ? `&sort=${sortType}` : ''}`}
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

        {/* 칩 목록 (가로 스크롤) */}
        <div className="flex flex-col gap-2">
          {sampleSpots.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5">
              <span className="text-[10px] text-[#a09587] font-bold shrink-0 min-w-[28px]">스팟</span>
              <div className="flex items-center gap-1 flex-nowrap">
                {sampleSpots.map((spotName: string) => {
                  const active = filterSpots.includes(spotName);
                  return (
                    <Link
                      key={spotName}
                      href={getFilterUrl('spot', spotName)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border shrink-0 ${
                        active
                          ? 'bg-[#3d332a] text-white border-[#3d332a] shadow-2xs'
                          : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                      }`}
                    >
                      📍 {spotName}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {sampleTricks.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5">
              <span className="text-[10px] text-[#a09587] font-bold shrink-0 min-w-[28px]">기술</span>
              <div className="flex items-center gap-1 flex-nowrap">
                {sampleTricks.map((trickName: string) => {
                  const active = filterTricks.includes(trickName);
                  return (
                    <Link
                      key={trickName}
                      href={getFilterUrl('trick', trickName)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border shrink-0 ${
                        active
                          ? 'bg-[#3d332a] text-white border-[#3d332a] shadow-2xs'
                          : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                      }`}
                    >
                      🛹 {trickName}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {sampleRiders.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-0.5">
              <span className="text-[10px] text-[#a09587] font-bold shrink-0 min-w-[28px]">보더</span>
              <div className="flex items-center gap-1 flex-nowrap">
                {sampleRiders.map((riderName: string) => {
                  const active = filterRiders.includes(riderName);
                  return (
                    <Link
                      key={riderName}
                      href={getFilterUrl('rider', riderName)}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition border shrink-0 ${
                        active
                          ? 'bg-[#3d332a] text-white border-[#3d332a] shadow-2xs'
                          : 'bg-[#f7f4ef] text-[#544a3e] border-[#e8e2d8] hover:border-[#a88963]'
                      }`}
                    >
                      👤 {riderName}
                    </Link>
                  );
                })}
              </div>
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
          initialVideos={allVideos}
          filterSpot={params.spot}
          filterTrick={params.trick}
          filterRider={params.rider}
          filterType={filterType}
          sortType={sortType}
        />
      </section>
    </main>
  );
}
