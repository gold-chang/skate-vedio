'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Edit3, Lock, Upload, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  // DB 참조용 데이터
  const [existingSpots, setExistingSpots] = useState<any[]>([]);
  const [existingTricks, setExistingTricks] = useState<any[]>([]);
  const [existingRiders, setExistingRiders] = useState<any[]>([]);

  // 폼 및 관리 데이터 상태
  const [videos, setVideos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [riderName, setRiderName] = useState('');
  const [riderInsta, setRiderInsta] = useState('');
  const [spotName, setSpotName] = useState('');
  const [trickName, setTrickName] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123dldmsckd') {
      setIsAuth(true);
      fetchAdminData();
    } else {
      alert('비밀번호가 올바르지 않습니다.');
    }
  };

  const fetchAdminData = async () => {
    const { data: videoData } = await supabase
      .from('videos')
      .select('*, riders(*), spots(*), tricks(*)')
      .order('created_at', { ascending: false });
    if (videoData) setVideos(videoData);

    const { data: spotsData } = await supabase.from('spots').select('*').order('name');
    const { data: tricksData } = await supabase.from('tricks').select('*').order('name');
    const { data: ridersData } = await supabase.from('riders').select('*').order('name');

    if (spotsData) setExistingSpots(spotsData);
    if (tricksData) setExistingTricks(tricksData);
    if (ridersData) setExistingRiders(ridersData);
  };

  const handleRiderNameChange = (val: string) => {
    setRiderName(val);
    const matchedRider = existingRiders.find(
      (r) => r.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matchedRider && matchedRider.instagram) {
      setRiderInsta(matchedRider.instagram);
    }
  };

  const uploadVideoFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        alert('영상 파일 업로드 실패: ' + uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !spotName || !trickName || !riderName) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!editingId && !videoFile && !existingVideoUrl) {
      alert('영상 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      let finalVideoUrl = existingVideoUrl || '/test.mp4';

      if (videoFile) {
        const uploadedUrl = await uploadVideoFile(videoFile);
        if (uploadedUrl) {
          finalVideoUrl = uploadedUrl;
        } else {
          setIsUploading(false);
          return;
        }
      }

      let riderId;
      const existingRider = existingRiders.find(
        (r) => r.name.trim().toLowerCase() === riderName.trim().toLowerCase()
      );

      if (existingRider) {
        riderId = existingRider.id;
        if (riderInsta && existingRider.instagram !== riderInsta) {
          await supabase.from('riders').update({ instagram: riderInsta }).eq('id', riderId);
        }
      } else {
        const { data: newRider } = await supabase
          .from('riders')
          .insert({ name: riderName.trim(), instagram: riderInsta.trim() })
          .select('id')
          .single();
        riderId = newRider?.id;
      }

      let spotId;
      const existingSpot = existingSpots.find(
        (s) => s.name.trim().toLowerCase() === spotName.trim().toLowerCase()
      );

      if (existingSpot) {
        spotId = existingSpot.id;
      } else {
        const { data: newSpot } = await supabase
          .from('spots')
          .insert({ name: spotName.trim() })
          .select('id')
          .single();
        spotId = newSpot?.id;
      }

      let trickId;
      const existingTrick = existingTricks.find(
        (t) => t.name.trim().toLowerCase() === trickName.trim().toLowerCase()
      );

      if (existingTrick) {
        trickId = existingTrick.id;
      } else {
        const { data: newTrick } = await supabase
          .from('tricks')
          .insert({ name: trickName.trim() })
          .select('id')
          .single();
        trickId = newTrick?.id;
      }

      if (editingId) {
        await supabase.from('videos').update({
          title,
          video_url: finalVideoUrl,
          rider_id: riderId,
          spot_id: spotId,
          trick_id: trickId,
        }).eq('id', editingId);
        alert('영상이 수정되었습니다.');
      } else {
        await supabase.from('videos').insert({
          title,
          video_url: finalVideoUrl,
          rider_id: riderId,
          spot_id: spotId,
          trick_id: trickId,
        });
        alert('새 영상이 업로드 및 등록되었습니다.');
      }

      resetForm();
      fetchAdminData();
    } catch (error) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await supabase.from('videos').delete().eq('id', id);
      fetchAdminData();
    }
  };

  const startEdit = (video: any) => {
    const rider = Array.isArray(video.riders) ? video.riders[0] : video.riders;
    const spot = Array.isArray(video.spots) ? video.spots[0] : video.spots;
    const trick = Array.isArray(video.tricks) ? video.tricks[0] : video.tricks;

    setEditingId(video.id);
    setTitle(video.title);
    setExistingVideoUrl(video.video_url);
    setRiderName(rider?.name || '');
    setRiderInsta(rider?.instagram || '');
    setSpotName(spot?.name || '');
    setTrickName(trick?.name || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setVideoFile(null);
    setExistingVideoUrl('');
    setRiderName('');
    setRiderInsta('');
    setSpotName('');
    setTrickName('');
  };

  // 비밀번호 인증 전 화면 (베이지 톤 + 비번 미노출)
  if (!isAuth) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-5 flex flex-col items-center justify-center max-w-md mx-auto font-sans antialiased">
        <form onSubmit={handleLogin} className="w-full bg-white border border-[#e8e2d8] p-7 rounded-3xl flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 bg-[#f0ebd9] text-[#7a5c38] rounded-2xl flex items-center justify-center mb-1">
              <Lock size={22} />
            </div>
            <h2 className="text-base font-bold text-[#3d332a]">관리자 인증</h2>
            <p className="text-xs text-[#8c8275]">비밀번호를 입력하여 관리자 권한을 인증하세요.</p>
          </div>

          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3.5 text-sm text-[#2c2825] focus:outline-none focus:border-[#a88963] focus:ring-1 focus:ring-[#a88963] transition"
          />

          <button type="submit" className="w-full bg-[#3d332a] hover:bg-[#2c231a] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-sm active:scale-[0.98]">
            접속하기
          </button>
          
          <Link href="/" className="text-xs text-center text-[#8c8275] hover:text-[#3d332a] transition underline underline-offset-4 mt-1">
            메인 페이지로 돌아가기
          </Link>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col max-w-md mx-auto pb-12 font-sans antialiased">
      <datalist id="spot-list">
        {existingSpots.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
      <datalist id="trick-list">
        {existingTricks.map((t) => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>
      <datalist id="rider-list">
        {existingRiders.map((r) => (
          <option key={r.id} value={r.name} />
        ))}
      </datalist>

      {/* 헤더 */}
      <div className="flex items-center justify-between my-3">
        <Link href="/" className="flex items-center gap-1 text-[#8c8275] text-xs font-semibold hover:text-[#3d332a] transition">
          <ArrowLeft size={16} /> 메인으로
        </Link>
        <h1 className="text-sm font-bold text-[#7a5c38]">영상 데이터 관리자</h1>
      </div>

      {/* 입력/수정 폼 */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#e8e2d8] p-5 rounded-3xl flex flex-col gap-3.5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#3d332a]">
          {editingId ? '✏️ 영상 데이터 수정' : '➕ 새 영상 업로드'}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8c8275]">영상 제목 *</label>
          <input
            type="text"
            placeholder="예: 성수 스팟 베스트 트릭"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8c8275] flex items-center gap-1">
            <Upload size={12} /> 영상 파일 선택 (MP4 등) *
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-2.5 text-xs text-[#6e6355] file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-[#f0ebd9] file:text-[#7a5c38] hover:file:bg-[#e4ddc7]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">스팟 *</label>
            <input
              type="text"
              list="spot-list"
              placeholder="선택 또는 입력"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">기술명 *</label>
            <input
              type="text"
              list="trick-list"
              placeholder="선택 또는 입력"
              value={trickName}
              onChange={(e) => setTrickName(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">스케이터 *</label>
            <input
              type="text"
              list="rider-list"
              placeholder="이름 입력"
              value={riderName}
              onChange={(e) => handleRiderNameChange(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">인스타 계정</label>
            <input
              type="text"
              placeholder="자동 입력"
              value={riderInsta}
              onChange={(e) => setRiderInsta(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="flex-1 bg-[#3d332a] hover:bg-[#2c231a] disabled:bg-[#c2bbb0] text-white font-bold py-3 rounded-2xl text-xs transition shadow-sm active:scale-[0.98]"
          >
            {isUploading ? '업로드 중...' : editingId ? '수정 완료' : '업로드 및 등록'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-[#e8e2d8] text-[#544a3e] font-semibold py-3 px-4 rounded-2xl text-xs transition hover:bg-[#dcd5cb]"
            >
              취소
            </button>
          )}
        </div>
      </form>

      {/* 등록된 목록 */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-[#8c8275] px-1">등록된 영상 ({videos.length})</h3>
        {videos.map((v) => {
          const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
          const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
          const trick = Array.isArray(v.tricks) ? v.tricks[0] : v.tricks;

          return (
            <div key={v.id} className="bg-white border border-[#e8e2d8] p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 overflow-hidden pr-2">
                <span className="text-xs font-bold text-[#3d332a] truncate">{v.title}</span>
                <div className="flex gap-1.5 text-[10px] text-[#8c8275] flex-wrap">
                  <span>📍 {spot?.name}</span>
                  <span>🛹 {trick?.name}</span>
                  <span>👤 {rider?.name}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEdit(v)} className="p-2 bg-[#f0ebd9] text-[#7a5c38] rounded-xl hover:bg-[#e4ddc7] transition">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-2 bg-[#fce8e6] text-[#d9383a] rounded-xl hover:bg-[#f9d2d0] transition">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
