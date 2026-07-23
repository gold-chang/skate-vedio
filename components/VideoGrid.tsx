'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Play, Heart, Trophy } from 'lucide-react';
import Link from 'next/link';

interface VideoGridProps {
  initialVideos: any[];
  filterSpot?: string;
  filterTrick?: string;
  filterRider?: string;
  filterType?: string;
  sortType: string;
}

export default function VideoGrid({
  initialVideos,
  filterSpot,
  filterTrick,
  filterRider,
  filterType,
  sortType,
}: VideoGridProps) {
  const [videos, setVideos] = useState<any[]>(initialVideos);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(initialVideos.length >= 20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // 필터나 정렬 변경 시 리셋
  useEffect(() => {
    setVideos(initialVideos);
    setPage(1);
    setHasMore(initialVideos.length >= 20);
  }, [initialVideos, filterSpot, filterTrick, filterRider, filterType, sortType]);

  // 추가 영상 20개 불러오기
  const loadMoreVideos = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const PAGE_SIZE = 10;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let orderByField = sortType === 'recent' ? 'created_at' : 'likes';

    const { data: rawVideos, error } = await supabase
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
      .range(from, to);

    if (error || !rawVideos || rawVideos.length === 0) {
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    const formatted = rawVideos.map((v: any) => {
      let multiTricks: any[] = [];
      if (v.video_tricks && Array.isArray(v.video_tricks) && v.video_tricks.length > 0) {
        multiTricks = v.video_tricks.map((vt: any) => vt?.tricks).filter(Boolean);
      }
      if (multiTricks.length === 0 && v.tricks) {
        multiTricks = Array.isArray(v.tricks) ? v.tricks : [v.tricks];
      }
      return { ...v, tricksList: multiTricks };
    });

    const filtered = formatted.filter((v: any) => {
      const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
      const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
      const tricks = v.tricksList || [];

      if (filterType && rider?.rider_type !== filterType) return false;
      if (filterSpot && spot?.name !== filterSpot) return false;
      if (filterTrick && !tricks.some((t: any) => t?.name === filterTrick)) return false;
      if (filterRider && rider?.name !== filterRider) return false;
      return true;
    });

    if (rawVideos.length < PAGE_SIZE) {
      setHasMore(false);
    }

    setVideos((prev) => [...prev, ...filtered]);
    setPage((prev) => prev + 1);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreVideos();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  if (videos.length === 0) {
    return (
      <div className="py-12 text-center text-[#8c8275] text-xs">
        등록된 영상이 없거나 선택한 필터 조건에 일치하는 영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 2열 그리드 영상 카드 목록 */}
      <div className="grid grid-cols-2 gap-2.5">
        {videos.map((item: any) => {
          const r = Array.isArray(item.riders) ? item.riders[0] : item.riders;
          const s = Array.isArray(item.spots) ? item.spots[0] : item.spots;
          const tricks = item.tricksList || [];

          return (
            <div
              key={item.id}
              className="bg-white border border-[#e8e2d8] rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition flex flex-col"
            >
              {/* 썸네일 (클릭 시 상세페이지 이동) */}
              <Link href={`/video/${item.id}`} className="relative aspect-square bg-[#221e1a] group block overflow-hidden">
                <video
                  src={`${item.video_url}#t=0.1`}
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300 opacity-90"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                  <div className="w-9 h-9 bg-white/90 text-[#3d332a] rounded-full flex items-center justify-center group-hover:scale-110 transition shadow-md backdrop-blur-xs">
                    <Play size={16} className="ml-0.5 fill-[#3d332a]" />
                  </div>
                </div>

                {r?.rider_type === '프로' && (
                  <div className="absolute top-2 left-2 bg-amber-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-md text-white text-[9px] font-extrabold shadow-2xs flex items-center gap-0.5">
                    <Trophy size={9} /> PRO
                  </div>
                )}

                <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/40 flex items-center gap-0.5 text-[#e04f5f] text-[10px] font-bold shadow-2xs">
                  <Heart size={10} className="fill-[#e04f5f]" />
                  <span>{item.likes || 0}</span>
                </div>
              </Link>

              {/* 하단 메타 정보 & 필터 연동 칩들 */}
              <div className="p-2.5 flex flex-col gap-1.5">
                <Link href={`/video/${item.id}`} className="text-xs font-bold text-[#2c2825] hover:text-[#7a5c38] leading-tight line-clamp-1">
                  {item.title}
                </Link>

                <div className="flex items-center gap-1 flex-wrap">
                  {/* 📍 스팟 칩 (클릭 시 스팟 필터 적용) */}
                  {s?.name && (
                    <Link
                      href={`/?spot=${encodeURIComponent(s.name)}`}
                      className="text-[9px] bg-[#f7f4ef] text-[#6e6355] hover:bg-[#e8e2d8] hover:text-[#3d332a] px-1.5 py-0.5 rounded border border-[#e8e2d8] font-medium truncate max-w-[90px] transition active:scale-95"
                    >
                      📍 {s.name}
                    </Link>
                  )}

                  {/* 🛹 기술 칩들 (클릭 시 기술 필터 적용) */}
                  {tricks.map((t: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/?trick=${encodeURIComponent(t?.name || '')}`}
                      className="text-[9px] bg-[#f0ebd9] text-[#7a5c38] hover:bg-[#e4ddc7] hover:text-[#3d332a] px-1.5 py-0.5 rounded border border-[#e4ddc7] font-bold truncate max-w-[90px] transition active:scale-95"
                    >
                      🛹 {t?.name}
                    </Link>
                  ))}

                  {/* 👤 스케이터 칩 (클릭 시 보더 필터 적용) */}
                  {r?.name && (
                    <Link
                      href={`/?rider=${encodeURIComponent(r.name)}`}
                      className="text-[9px] bg-[#f7f4ef] text-[#6e6355] hover:bg-[#e8e2d8] hover:text-[#3d332a] px-1.5 py-0.5 rounded border border-[#e8e2d8] font-medium truncate max-w-[90px] transition active:scale-95"
                    >
                      👤 {r.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 무한 스크롤 영역 */}
      {hasMore && (
        <div ref={observerRef} className="py-6 flex items-center justify-center text-xs text-[#8c8275] font-medium">
          {isLoading ? '추가 영상 불러오는 중...' : '스크롤하여 더 보기'}
        </div>
      )}
    </div>
  );
}
