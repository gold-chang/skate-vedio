'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation'; // 🚀 이전 위치 및 필터 유지를 위한 useRouter 추가
import { supabase } from '../../../lib/supabase';
import SkateVideoPlayer from '../../../components/SkateVideoPlayer';
import { ArrowLeft, Heart, MessageSquare, Send, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter(); // 🚀 router 인스턴스 생성
  const resolvedParams = use(params);
  const videoId = resolvedParams.id;

  const [video, setVideo] = useState<any>(null);
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState<string>('');
  const [commentContent, setCommentContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const savedNickname = localStorage.getItem('skate_nickname');
    if (savedNickname) setNickname(savedNickname);

    fetchVideoAndComments();
  }, [videoId]);

  const fetchVideoAndComments = async () => {
    setLoading(true);

    const { data: videoData } = await supabase
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
      .eq('id', videoId)
      .single();

    if (videoData) {
      const multiTricks = videoData.video_tricks && videoData.video_tricks.length > 0
        ? videoData.video_tricks.map((vt: any) => vt.tricks).filter(Boolean)
        : (videoData.tricks ? [videoData.tricks] : []);

      setVideo({ ...videoData, tricksList: multiTricks });
      setLikes(videoData.likes || 0);
    }

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (commentsData) {
      setComments(commentsData);
    }

    setLoading(false);
  };

  const handleLike = async () => {
    if (hasLiked) return;

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);

    await supabase.from('videos').update({ likes: newLikes }).eq('id', videoId);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      alert('닉네임을 입력해 주세요.');
      return;
    }
    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해 주세요.');
      return;
    }
    if (commentContent.length > 100) {
      alert('댓글은 최대 100자까지 작성할 수 있습니다.');
      return;
    }

    setIsSubmitting(true);
    localStorage.setItem('skate_nickname', nickname.trim());

    const { data, error } = await supabase
      .from('comments')
      .insert({
        video_id: videoId,
        nickname: nickname.trim(),
        content: commentContent.trim(),
      })
      .select('*')
      .single();

    if (error) {
      alert('댓글 작성 중 오류가 발생했습니다: ' + error.message);
    } else if (data) {
      setComments([data, ...comments]);
      setCommentContent('');
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] flex items-center justify-center text-xs text-[#8c8275]">
        로딩 중...
      </main>
    );
  }

  if (!video) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] flex flex-col items-center justify-center text-xs text-[#8c8275] gap-3">
        <span>영상을 찾을 수 없습니다.</span>
        <button onClick={() => router.back()} className="text-[#a88963] font-bold underline cursor-pointer">
          이전으로 돌아가기
        </button>
      </main>
    );
  }

  const rider = Array.isArray(video.riders) ? video.riders[0] : video.riders;
  const spot = Array.isArray(video.spots) ? video.spots[0] : video.spots;
  const tricksList = video.tricksList || [];

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col items-center max-w-md mx-auto pb-16 font-sans antialiased">
      {/* 🚀 상단 네비게이션 - router.back() 적용 */}
      <div className="w-full my-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-xs font-semibold text-[#8c8275] hover:text-[#3d332a] transition cursor-pointer"
        >
          <ArrowLeft size={16} /> 목록으로
        </button>
        <span className="text-xs font-bold text-[#7a5c38]">스케이트보드 로그</span>
      </div>

      {/* 비디오 플레이어 */}
      <div className="w-full mb-3">
        <SkateVideoPlayer src={video.video_url} />
      </div>

      {/* 🚀 영상 플레이어 하단 [목록으로 돌아가기] 버튼 - router.back() 적용 */}
      <div className="w-full mb-3 flex justify-end">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#3d332a] text-[#f7f4ef] hover:bg-[#2c231a] rounded-2xl text-xs font-bold transition shadow-2xs active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>목록으로 돌아가기</span>
        </button>
      </div>

      {/* 상세 정보 카드 */}
      <div className="w-full bg-white border border-[#e8e2d8] rounded-3xl p-5 shadow-sm flex flex-col gap-4 mb-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-base font-bold text-[#2c2825] leading-snug">{video.title}</h1>
          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-bold transition flex-shrink-0 cursor-pointer ${
              hasLiked
                ? 'bg-[#e04f5f] text-white border-[#e04f5f]'
                : 'bg-[#f7f4ef] text-[#e04f5f] border-[#e8e2d8] hover:border-[#e04f5f]'
            }`}
          >
            <Heart size={14} className={hasLiked ? 'fill-white' : 'fill-[#e04f5f]'} />
            <span>{likes}</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#f0ebd9] pt-3 text-xs">
          {/* 스팟 */}
          <div className="flex justify-between items-center">
            <span className="text-[#8c8275] font-medium min-w-[60px]">📍 스팟</span>
            {spot?.name ? (
              <Link
                href={`/?spot=${encodeURIComponent(spot.name)}`}
                className="flex items-center gap-1 bg-[#f0ebd9] text-[#7a5c38] hover:bg-[#e4ddc7] px-3 py-1.5 rounded-xl font-bold transition border border-[#e4ddc7] active:scale-95"
              >
                <span>{spot.name}</span>
                <ChevronRight size={13} />
              </Link>
            ) : (
              <span className="font-bold text-[#3d332a]">-</span>
            )}
          </div>

          {/* 기술 */}
          <div className="flex justify-between items-start gap-2">
            <span className="text-[#8c8275] font-medium min-w-[60px] pt-1.5">🛹 기술</span>
            <div className="flex flex-wrap justify-end gap-1.5">
              {tricksList.length > 0 ? (
                tricksList.map((t: any, idx: number) => (
                  <Link
                    key={idx}
                    href={`/?trick=${encodeURIComponent(t.name)}`}
                    className="flex items-center gap-0.5 bg-[#f0ebd9] text-[#7a5c38] hover:bg-[#e4ddc7] px-3 py-1.5 rounded-xl font-bold transition border border-[#e4ddc7] active:scale-95"
                  >
                    <span>{t.name}</span>
                    <ChevronRight size={13} />
                  </Link>
                ))
              ) : (
                <span className="font-bold text-[#3d332a]">-</span>
              )}
            </div>
          </div>

          {/* 스케이터 */}
          <div className="flex justify-between items-center">
            <span className="text-[#8c8275] font-medium min-w-[60px]">👤 스케이터</span>
            {rider?.name ? (
              <Link
                href={`/?rider=${encodeURIComponent(rider.name)}`}
                className="flex items-center gap-1 bg-[#f0ebd9] text-[#7a5c38] hover:bg-[#e4ddc7] px-3 py-1.5 rounded-xl font-bold transition border border-[#e4ddc7] active:scale-95"
              >
                <span>
                  {rider.name} {rider.rider_type === '프로' && '🏆'}
                </span>
                <ChevronRight size={13} />
              </Link>
            ) : (
              <span className="font-bold text-[#3d332a]">-</span>
            )}
          </div>

          {rider?.instagram && (
            <div className="flex justify-between items-center">
              <span className="text-[#8c8275] font-medium min-w-[60px]">📸 인스타</span>
              <a
                href={`https://instagram.com/${rider.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#a88963] font-bold hover:underline"
              >
                @{rider.instagram.replace('@', '')}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 댓글 섹션 */}
      <section className="w-full bg-white border border-[#e8e2d8] rounded-3xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#f0ebd9] pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#3d332a]">
            <MessageSquare size={16} className="text-[#7a5c38]" />
            <span>댓글 ({comments.length})</span>
          </div>
        </div>

        {/* 댓글 작성 폼 */}
        <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <User size={13} className="absolute left-3 top-3 text-[#a09587]" />
              <input
                type="text"
                placeholder="닉네임"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={12}
                className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-xl pl-8 pr-3 py-2 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
              />
            </div>
            <span className="text-[10px] text-[#a09587] font-mono">
              {commentContent.length}/100자
            </span>
          </div>

          <div className="flex gap-2">
            <textarea
              placeholder="스케이터에게 응원의 한마디나 의견을 남겨주세요 (100자 이내)"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              maxLength={100}
              rows={2}
              className="flex-1 bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] resize-none focus:outline-none focus:border-[#a88963]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3d332a] hover:bg-[#2c231a] disabled:bg-[#c2bbb0] text-white px-4 rounded-2xl flex items-center justify-center transition shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </div>
        </form>

        {/* 댓글 목록 */}
        <div className="flex flex-col gap-3 mt-2">
          {comments.length > 0 ? (
            comments.map((c) => {
              const cDate = c.created_at
                ? new Date(c.created_at).toLocaleDateString('ko-KR', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';

              return (
                <div key={c.id} className="bg-[#f7f4ef] p-3 rounded-2xl flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3d332a]">{c.nickname}</span>
                    <span className="text-[10px] text-[#a09587] font-mono">{cDate}</span>
                  </div>
                  <p className="text-[#544a3e] leading-relaxed break-all whitespace-pre-wrap">
                    {c.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-[#a09587] text-xs">
              첫 번째 댓글을 작성해 보세요! 🛹
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
