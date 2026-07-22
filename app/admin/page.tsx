'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Edit3, Lock, Upload, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);

  const [existingSpots, setExistingSpots] = useState<any[]>([]);
  const [existingTricks, setExistingTricks] = useState<any[]>([]);
  const [existingRiders, setExistingRiders] = useState<any[]>([]);

  const [videos, setVideos] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [riderName, setRiderName] = useState('');
  const [riderInsta, setRiderInsta] = useState('');
  const [riderType, setRiderType] = useState('일반인');
  const [spotName, setSpotName] = useState('');
  const [trickNamesInput, setTrickNamesInput] = useState('');

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
      .select('*, riders(*), spots(*), video_tricks(tricks(*))')
      .order('created_at', { ascending: false });

    if (videoData) {
      const formatted = videoData.map((v) => {
        const multiTricks = v.video_tricks && v.video_tricks.length > 0
          ? v.video_tricks.map((vt: any) => vt.tricks).filter(Boolean)
          : [];
        return { ...v, tricks: multiTricks };
      });
      setVideos(formatted);
    }

    const { data: spotsData } = await supabase.from('spots').select('*').order('name');
    const { data: tricksData } = await supabase.from('tricks').select('*').order('name');
    const { data: ridersData } = await supabase.from('riders').select('*').order('name');

    if (spotsData) setExistingSpots(spotsData);
    if (tricksData) setExistingTricks(tricksData);
    if (ridersData) setExistingRiders(ridersData);
  };

  const handleSelectRider = (rider: any) => {
    setRiderName(rider.name);
    if (rider.instagram) setRiderInsta(rider.instagram);
    if (rider.rider_type) setRiderType(rider.rider_type);
  };

  const handleAddTrickChip = (trickName: string) => {
    if (!trickNamesInput.trim()) {
      setTrickNamesInput(trickName);
    } else {
      const currentList = trickNamesInput.split(',').map((s) => s.trim()).filter(Boolean);
      if (!currentList.includes(trickName)) {
        setTrickNamesInput([...currentList, trickName].join(', '));
      }
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
    if (!title || !spotName || !trickNamesInput || !riderName) {
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

      // 1. 라이더(Rider) 처리
      let riderId;
      const existingRider = existingRiders.find(
        (r) => r.name.trim().toLowerCase() === riderName.trim().toLowerCase()
      );

      if (existingRider) {
        riderId = existingRider.id;
        await supabase
          .from('riders')
          .update({ instagram: riderInsta, rider_type: riderType })
          .eq('id', riderId);
      } else {
        const { data: newRider } = await supabase
          .from('riders')
          .insert({ name: riderName.trim(), instagram: riderInsta.trim(), rider_type: riderType })
          .select('id')
          .single();
        riderId = newRider?.id;
      }

      // 2. 스팟(Spot) 처리
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

      // 3. 복수 기술(Tricks) 각각 DB 등록 및 ID 수집
      const rawTrickList = trickNamesInput.split(',').map((t) => t.trim()).filter(Boolean);
      const trickIds: number[] = [];

      for (const tName of rawTrickList) {
        const existingTrick = existingTricks.find(
          (t) => t.name.trim().toLowerCase() === tName.toLowerCase()
        );
        if (existingTrick) {
          trickIds.push(existingTrick.id);
        } else {
          const { data: newTrick } = await supabase
            .from('tricks')
            .insert({ name: tName })
            .select('id')
            .single();
          if (newTrick) trickIds.push(newTrick.id);
        }
      }

      // 4. 비디오 데이터 저장
      let targetVideoId = editingId;

      if (editingId) {
        await supabase.from('videos').update({
          title,
          video_url: finalVideoUrl,
          rider_id: riderId,
          spot_id: spotId,
          trick_id: trickIds[0] || null,
        }).eq('id', editingId);

        // 기존 중간 테이블 데이터 초기화
        await supabase.from('video_tricks').delete().eq('video_id', editingId);
      } else {
        const { data: newVideo, error: videoInsertErr } = await supabase.from('videos').insert({
          title,
          video_url: finalVideoUrl,
          rider_id: riderId,
          spot_id: spotId,
          trick_id: trickIds[0] || null,
        }).select('id').single();

        if (videoInsertErr) {
          throw videoInsertErr;
        }
        targetVideoId = newVideo?.id;
      }

      // 5. video_tricks 다대다 중간 테이블에 복수 기술 저장 (가장 중요 🌟)
      if (targetVideoId && trickIds.length > 0) {
        const videoTricksPayload = trickIds.map((tid) => ({
          video_id: targetVideoId,
          trick_id: tid,
        }));
        
        const { error: vtError } = await supabase.from('video_tricks').insert(videoTricksPayload);
        if (vtError) {
          console.error('video_tricks insert error:', vtError);
        }
      }

      alert(editingId ? '영상이 수정되었습니다.' : '새 영상이 복수 기술과 함께 등록되었습니다.');
      resetForm();
      fetchAdminData();
    } catch (error: any) {
      console.error(error);
      alert('처리 중 오류가 발생했습니다: ' + (error?.message || error));
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
    const tricks = video.tricks || [];

    setEditingId(video.id);
    setTitle(video.title);
    setExistingVideoUrl(video.video_url);
    setRiderName(rider?.name || '');
    setRiderInsta(rider?.instagram || '');
    setRiderType(rider?.rider_type || '일반인');
    setSpotName(spot?.name || '');
    setTrickNamesInput(tricks.map((t: any) => t?.name).filter(Boolean).join(', '));
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setVideoFile(null);
    setExistingVideoUrl('');
    setRiderName('');
    setRiderInsta('');
    setRiderType('일반인');
    setSpotName('');
    setTrickNamesInput('');
  };

  if (!isAuth) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-5 flex flex-col items-center justify-center max-w-md mx-auto font-sans antialiased">
        <form onSubmit={handleLogin} className="w-full bg-white border border-[#e8e2d8] p-7 rounded-3xl flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-12 h-12 bg-[#f0ebd9] text-[#7a5c38] rounded-2xl flex items-center justify-center mb-1">
              <Lock size={22} />
            </div>
            <h2 className="text-base font-bold text-[#3d332a]">관리자 인증</h2>
          </div>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3.5 text-sm text-[#2c2825] focus:outline-none focus:border-[#a88963]"
          />
          <button type="submit" className="w-full bg-[#3d332a] text-white font-bold py-3.5 rounded-2xl text-sm transition shadow-sm active:scale-[0.98]">
            접속하기
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ef] text-[#2c2825] p-4 flex flex-col max-w-md mx-auto pb-12 font-sans antialiased">
      <div className="flex items-center justify-between my-3">
        <Link href="/" className="flex items-center gap-1 text-[#8c8275] text-xs font-semibold hover:text-[#3d332a] transition">
          <ArrowLeft size={16} /> 메인으로
        </Link>
        <h1 className="text-sm font-bold text-[#7a5c38]">스케이트보드 로그 관리자</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-[#e8e2d8] p-5 rounded-3xl flex flex-col gap-3.5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-[#3d332a]">
          {editingId ? '✏️ 영상 데이터 수정' : '➕ 새 영상 업로드'}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8c8275]">영상 제목 *</label>
          <input
            type="text"
            placeholder="예: 창규 코치님 뱅크 알리"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8c8275] flex items-center gap-1">
            <Upload size={12} /> 영상 파일 선택 *
          </label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-2.5 text-xs text-[#6e6355] file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-[#f0ebd9] file:text-[#7a5c38]"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">스팟 *</label>
            <input
              type="text"
              placeholder="스팟명 입력"
              value={spotName}
              onChange={(e) => setSpotName(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
            {existingSpots.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {existingSpots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSpotName(s.name)}
                    className="text-[10px] bg-[#f0ebd9] text-[#7a5c38] px-2 py-1 rounded-lg border border-[#e4ddc7] active:scale-95 transition font-medium"
                  >
                    📍 {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">기술명 (쉼표 , 구분) *</label>
            <input
              type="text"
              placeholder="예: 뱅크알리, 킥플립, 50-50"
              value={trickNamesInput}
              onChange={(e) => setTrickNamesInput(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
            {existingTricks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {existingTricks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleAddTrickChip(t.name)}
                    className="text-[10px] bg-[#f0ebd9] text-[#7a5c38] px-2 py-1 rounded-lg border border-[#e4ddc7] active:scale-95 transition font-medium flex items-center gap-0.5"
                  >
                    <Plus size={10} /> 🛹 {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">스케이터 이름 *</label>
            <input
              type="text"
              placeholder="이름 입력"
              value={riderName}
              onChange={(e) => setRiderName(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#8c8275]">구분</label>
            <select
              value={riderType}
              onChange={(e) => setRiderType(e.target.value)}
              className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] font-bold focus:outline-none focus:border-[#a88963]"
            >
              <option value="일반인">일반인</option>
              <option value="프로">🏆 프로</option>
            </select>
          </div>
        </div>

        {existingRiders.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {existingRiders.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRider(r)}
                className="text-[10px] bg-[#f0ebd9] text-[#7a5c38] px-2 py-1 rounded-lg border border-[#e4ddc7] active:scale-95 transition font-medium"
              >
                👤 {r.name} {r.rider_type === '프로' && '🏆'}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-[#8c8275]">인스타 계정</label>
          <input
            type="text"
            placeholder="인스타 ID"
            value={riderInsta}
            onChange={(e) => setRiderInsta(e.target.value)}
            className="w-full bg-[#fcfbfa] border border-[#e0d8cc] rounded-2xl p-3 text-xs text-[#2c2825] focus:outline-none focus:border-[#a88963]"
          />
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

      <div className="flex flex-col gap-2.5">
        <h3 className="text-xs font-bold text-[#8c8275] px-1">등록된 영상 ({videos.length})</h3>
        {videos.map((v) => {
          const rider = Array.isArray(v.riders) ? v.riders[0] : v.riders;
          const spot = Array.isArray(v.spots) ? v.spots[0] : v.spots;
          const tricks = v.tricks || [];

          return (
            <div key={v.id} className="bg-white border border-[#e8e2d8] p-3.5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex flex-col gap-1 overflow-hidden pr-2">
                <span className="text-xs font-bold text-[#3d332a] truncate">{v.title}</span>
                <div className="flex gap-1.5 text-[10px] text-[#8c8275] flex-wrap items-center">
                  <span>📍 {spot?.name}</span>
                  <span>🛹 {tricks.map((t: any) => t?.name).filter(Boolean).join(', ')}</span>
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
