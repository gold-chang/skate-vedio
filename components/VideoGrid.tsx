'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Trophy } from 'lucide-react';
import Link from 'next/link';

interface VideoGridProps {
  initialVideos?: any[];
  filterSpot?: string;
  filterTrick?: string;
  filterRider?: string;
  filterType?: string;
  sortType?: string;
}

export default function VideoGrid({
  initialVideos = [],
  filterSpot = '',
  filterTrick = '',
  filterRider = '',
  filterType = '',
  sortType = 'likes',
}: VideoGridProps) {
  const safeInitialVideos = Array.isArray(initialVideos) ? initialVideos : [];

  const [videos, setVideos] = useState<any[]>(safeInitialVideos);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>((safeInitialVideos?.length ?? 0) >= 10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const spotsList = typeof filterSpot === 'string' && filterSpot.trim() ? filterSpot.split(',').filter(Boolean) : [];
  const tricksList = typeof filterTrick === 'string' && filterTrick.trim() ? filterTrick.split(',').filter(Boolean) : [];
  const ridersList = typeof filterRider === 'string' && filterRider.trim() ? filterRider.split(',').filter(Boolean) : [];

  const applyFilters = (rawList: any[]) => {
    if (!rawList || !Array.isArray(rawList)) return [];

    return rawList.filter((v: any) => {
      if (!v) return false;

      const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
      const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
      const tricks = Array.isArray(v.tricksList) ? v.tricksList : [];

      if (filterType && rider?.rider_type !== filterType) return false;

      if (spotsList.length > 0) {
        if (!spot || !spot.name || !spotsList.includes(spot.name)) return false;
      }

      if (tricksList.length > 0) {
        if (!tricks || tricks.length === 0) return false;
        const hasMatchingTrick = tricks.some((t: any) => t && t.name && tricksList.includes(t.name));
        if (!hasMatchingTrick) return false;
      }

      if (ridersList.length > 0) {
        if (!rider || !rider.name || !ridersList.includes(rider.name)) return false;
      }

      return true;
    });
  };

  useEffect(() => {
    const list = Array.isArray(initialVideos) ? initialVideos : [];
    setVideos(applyFilters(list));
    setPage(1);
    setHasMore((list?.length ?? 0) >= 10);
  }, [initialVideos, filterSpot, filterTrick, filterRider, filterType, sortType]);

  const loadMoreVideos = async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const PAGE_SIZE = 10;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let orderByField = sortType === 'recent' ? 'created_at' : 'likes';

    try {
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

      if (error || !rawVideos || !Array.isArray(rawVideos) || (rawVideos?.length ?? 0) === 0) {
        setHasMore(false);
        setIsLoading(false);
        return;
      }

      const formatted = rawVideos.map((v: any) => {
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

      const filtered = applyFilters(formatted);

      if ((rawVideos?.length ?? 0) < PAGE_SIZE) {
        setHasMore(false);
      }

      // 🚀 [핵심 해결책] 중복 ID 제거 로직 추가
      setVideos((prev) => {
        const currentList = Array.isArray(prev) ? prev : [];
        const existingIds = new Set(currentList.map((item) => item.id));
        const newUniqueVideos = filtered.filter((item) => !existingIds.has(item.id));

        // 새로 추가할 고유 영상이 더 이상 없으면 무한 스크롤 중단
        if (newUniqueVideos.length === 0) {
          setHasMore(false);
          return currentList;
        }

        return [...currentList, ...newUniqueVideos];
      });

      setPage((prev) => prev + 1);
    } catch (e) {
      console.error('Video load error:', e);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries && entries[0] && entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreVideos();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page]);

  if (!videos || !Array.isArray(videos) || (videos?.length ?? 0) === 0) {
    return (
      <div className="py-12 text-center text-[#8c8275] text-xs font-medium">
        등록된 영상이 없거나 선택한 필터 조건에 일치하는 영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        {videos.map((item: any) => {
          if (!item || !item.id) return null;
          const r = Array.isArray(item.riders) ? item.riders[0] : item.riders;
          const s = Array.isArray(item.spots) ? item.spots[0] : item.spots;
          const tricks = Array.isArray(item.tricksList) ? item.tricksList : [];

          return (
            <Link
              key={item.id}
              href={`/video/${item.id}`}
              className="relative aspect-[3/4] bg-[#221e1a] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition group block active:scale-[0.98]"
            >
              <video
                src={item.video_url ? `${item.video_url}#t=0.1` : ''}
                preload="metadata"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                muted
                playsInline
              />

              <div className="absolute top-0 inset-x-0 p-2 flex items-center justify-between bg-gradient-to-b from-black/60 via-transparent to-transparent">
                {r?.rider_type === '프로' ? (
                  <div className="bg-amber-600/90 backdrop-blur-md px-1.5 py-0.5 rounded-md text-white text-[9px] font-extrabold shadow-2xs flex items-center gap-0.5">
                    <Trophy size={9} /> PRO
                  </div>
                ) : (
                  <div />
                )}

                <div className="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 flex items-center gap-0.5 text-white text-[10px] font-bold shadow-2xs ml-auto">
                  <Heart size={10} className="fill-rose-500 text-rose-500" />
                  <span>{item.likes || 0}</span>
                </div>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col gap-1">
                <div className="flex items-center gap-1 flex-wrap">
                  {s?.name && (
                    <span className="text-[9px] bg-white/90 backdrop-blur-md text-[#3d332a] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs truncate max-w-[85px]">
                      📍 {s.name}
                    </span>
                  )}

                  {tricks.map((t: any, idx: number) => {
                    if (!t || !t.name) return null;
                    return (
                      <span
                        key={idx}
                        className="text-[9px] bg-[#f0ebd9]/95 backdrop-blur-md text-[#7a5c38] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs truncate max-w-[85px]"
                      >
                        🛹 {t.name}
                      </span>
                    );
                  })}

                  {r?.name && (
                    <span className="text-[9px] bg-white/90 backdrop-blur-md text-[#3d332a] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs truncate max-w-[85px]">
                      👤 {r.name}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {hasMore && (
        <div ref={observerRef} className="py-6 flex items-center justify-center text-xs text-[#8c8275] font-medium">
          {isLoading ? '추가 영상 불러오는 중...' : '스크롤하여 더 보기'}
        </div>
      )}
    </div>
  );
}
