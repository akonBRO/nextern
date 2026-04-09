'use client';
// src/components/profile/ProfilePictureUpload.tsx

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Eye, ImagePlus, Trash2, X, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

type UploaderType = 'profilePictureUploader' | 'companyLogoUploader';

type Props = {
  currentImage?: string | null;
  name?: string;
  size?: number;
  radius?: string;
  gradient?: string;
  uploaderType?: UploaderType; // which UT endpoint to use — default: profilePictureUploader
  label?: string; // modal title — default: 'Choose profile picture'
  onUploaded: (url: string) => void;
  onRemoved?: () => void;
};

const MAX_MB = 2;
const CROP_SIZE = 320;
const OUTPUT_SIZE = 800;

export default function ProfilePictureUpload({
  currentImage,
  name = '',
  size = 140,
  radius = '50%',
  gradient = 'linear-gradient(135deg, #2563EB, #22D3EE)',
  uploaderType = 'profilePictureUploader',
  label = 'Choose profile picture',
  onUploaded,
  onRemoved,
}: Props) {
  const { startUpload } = useUploadThing(uploaderType);

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(false); // smart positioning
  const [viewerOpen, setViewerOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // mouse drag
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  // touch drag
  const touchStart = useRef({ tx: 0, ty: 0, ox: 0, oy: 0 });

  // ── Close menu on outside click ────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Smart dropdown positioning: open above if near viewport bottom ─────
  function handleCameraClick() {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuAbove(spaceBelow < 180);
    }
    setMenuOpen((v) => !v);
  }

  // ── Redraw crop canvas ─────────────────────────────────────────────────
  useEffect(() => {
    if (!cropOpen || !imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
      ctx.save();
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      const coverScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height);
      const w = img.width * coverScale * zoom;
      const h = img.height * coverScale * zoom;
      ctx.drawImage(img, CROP_SIZE / 2 - w / 2 + offset.x, CROP_SIZE / 2 - h / 2 + offset.y, w, h);
      ctx.restore();
    };
    img.src = imageSrc;
  }, [cropOpen, imageSrc, zoom, offset]);

  // ── Open file → show crop ──────────────────────────────────────────────
  function openFile(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
    if (file.size > MAX_MB * 1024 * 1024) return;
    setImageSrc(URL.createObjectURL(file));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setMenuOpen(false);
    setCropOpen(true);
  }

  // ── Mouse drag handlers ────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    });
  }
  function onMouseUp() {
    setDragging(false);
  }

  // ── Touch drag handlers ────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { tx: t.clientX, ty: t.clientY, ox: offset.x, oy: offset.y };
  }
  function onTouchMove(e: React.TouchEvent) {
    e.preventDefault(); // stop page scroll
    const t = e.touches[0];
    setOffset({
      x: touchStart.current.ox + (t.clientX - touchStart.current.tx),
      y: touchStart.current.oy + (t.clientY - touchStart.current.ty),
    });
  }

  // ── Save cropped image → upload ────────────────────────────────────────
  async function handleSave() {
    if (!imageSrc) return;
    setUploading(true);
    try {
      const scale = OUTPUT_SIZE / CROP_SIZE;
      const fc = document.createElement('canvas');
      fc.width = OUTPUT_SIZE;
      fc.height = OUTPUT_SIZE;
      const ctx = fc.getContext('2d')!;
      const img = new window.Image();
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.src = imageSrc;
      });
      ctx.save();
      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();
      const coverScale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
      const w = img.width * coverScale * zoom;
      const h = img.height * coverScale * zoom;
      ctx.drawImage(
        img,
        OUTPUT_SIZE / 2 - w / 2 + offset.x * scale,
        OUTPUT_SIZE / 2 - h / 2 + offset.y * scale,
        w,
        h
      );
      ctx.restore();
      const blob: Blob = await new Promise((res) => fc.toBlob((b) => res(b!), 'image/jpeg', 0.92));
      const safeName = (name ?? 'user')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '');
      const filename = `ProfilePicture_${safeName}.jpg`;
      const croppedFile = new File([blob], filename, { type: 'image/jpeg' });
      const res = await startUpload([croppedFile]);
      if (res?.[0]?.ufsUrl) {
        onUploaded(res[0].ufsUrl);
        setCropOpen(false);
        setImageSrc(null);
      }
    } finally {
      setUploading(false);
    }
  }

  const initials = name?.charAt(0)?.toUpperCase() ?? '?';

  // ── Dropdown vertical position ─────────────────────────────────────────
  const dropdownPos = menuAbove
    ? { bottom: size + 10, top: 'auto' }
    : { top: size + 10, bottom: 'auto' };

  return (
    <>
      {/* ── Avatar + camera badge ──────────────────────────────────── */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        {/* Avatar */}
        <div
          ref={avatarRef}
          style={{
            width: size,
            height: size,
            borderRadius: radius,
            background: currentImage ? 'transparent' : gradient,
            border: '3px solid rgba(255,255,255,0.15)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(size * 0.38),
            fontWeight: 900,
            color: '#fff',
            fontFamily: 'var(--font-display)',
          }}
        >
          {currentImage ? (
            <Image
              src={currentImage}
              alt={name}
              width={size}
              height={size}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            initials
          )}
        </div>

        {/* Camera badge */}
        <button
          type="button"
          onClick={handleCameraClick}
          style={{
            position: 'absolute',
            bottom: 6,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#1E293B',
            border: '2px solid rgba(255,255,255,0.20)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            padding: 0,
            boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
            transition: 'background 0.15s, transform 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563EB';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#1E293B';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Camera size={11} />
        </button>

        {/* Dropdown — opens above or below based on viewport space */}
        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              ...dropdownPos,
              left: 0,
              zIndex: 200,
              background: '#1E293B',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
              minWidth: 228,
            }}
          >
            {currentImage && (
              <>
                <MenuBtn
                  icon={<Eye size={15} color="#94A3B8" />}
                  label={`See ${label.toLowerCase().replace('choose ', '')}`}
                  onClick={() => {
                    setViewerOpen(true);
                    setMenuOpen(false);
                  }}
                />
                <Divider />
              </>
            )}
            <MenuBtn
              icon={<ImagePlus size={15} color="#94A3B8" />}
              label={label}
              onClick={() => {
                fileInput.current?.click();
                setMenuOpen(false);
              }}
            />
            {currentImage && onRemoved && (
              <>
                <Divider />
                <MenuBtn
                  icon={<Trash2 size={15} color="#F87171" />}
                  label="Delete photo"
                  danger
                  onClick={() => {
                    setDeleteOpen(true);
                    setMenuOpen(false);
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) openFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* ── Full-screen viewer ─────────────────────────────────────── */}
      {viewerOpen && currentImage && (
        <div onClick={() => setViewerOpen(false)} style={backdropStyle}>
          <button type="button" onClick={() => setViewerOpen(false)} style={closeBtn}>
            <X size={18} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(82vw,480px)',
              height: 'min(82vw,480px)',
              borderRadius: radius === '50%' ? '50%' : radius,
              overflow: 'hidden',
              border: '4px solid rgba(255,255,255,0.14)',
              boxShadow: '0 0 80px rgba(0,0,0,0.7)',
            }}
          >
            <Image
              src={currentImage}
              alt={name}
              width={480}
              height={480}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
        </div>
      )}

      {/* ── Crop modal ────────────────────────────────────────────── */}
      {cropOpen && imageSrc && (
        <div
          onClick={() => {
            if (!uploading) {
              setCropOpen(false);
              setImageSrc(null);
            }
          }}
          style={backdropStyle}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 22,
              width: '100%',
              maxWidth: 480,
              overflow: 'hidden',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#F8FAFC',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {label}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCropOpen(false);
                  setImageSrc(null);
                }}
                disabled={uploading}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#94A3B8',
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Canvas — mouse + touch drag */}
            <div style={{ padding: '28px 28px 0', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: CROP_SIZE,
                  height: CROP_SIZE,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  cursor: dragging ? 'grabbing' : 'grab',
                  border: '2.5px solid rgba(255,255,255,0.12)',
                  background: '#1E293B',
                  userSelect: 'none',
                  touchAction: 'none', // prevent scroll while dragging on mobile
                }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={() => {
                  /* no-op — offset stays */
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={CROP_SIZE}
                  height={CROP_SIZE}
                  style={{
                    display: 'block',
                    width: CROP_SIZE,
                    height: CROP_SIZE,
                    borderRadius: '50%',
                  }}
                />
              </div>
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: '#475569',
                margin: '10px 0 0',
                fontWeight: 500,
              }}
            >
              Drag to reposition
            </p>

            {/* Zoom slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 28px' }}>
              <ZoomOut size={16} color="#475569" style={{ flexShrink: 0 }} />
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: '#2563EB', cursor: 'pointer' }}
              />
              <ZoomIn size={16} color="#475569" style={{ flexShrink: 0 }} />
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) openFile(f);
              }}
              style={{
                margin: '0 24px 22px',
                padding: '12px 16px',
                background: dragOver ? 'rgba(37,99,235,0.09)' : 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                border: `1.5px dashed ${dragOver ? '#2563EB' : 'rgba(255,255,255,0.10)'}`,
                textAlign: 'center',
                fontSize: 12,
                color: dragOver ? '#93C5FD' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontWeight: 500,
              }}
            >
              {dragOver ? '📂 Drop it here!' : 'JPG, PNG or WebP · max 2MB · click to change'}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, padding: '0 24px 24px' }}>
              <button
                type="button"
                onClick={() => {
                  setCropOpen(false);
                  setImageSrc(null);
                }}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12,
                  color: '#94A3B8',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: uploading ? '#1D4ED8' : 'linear-gradient(135deg,#2563EB,#1D4ED8)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-display)',
                  boxShadow: uploading ? 'none' : '0 4px 16px rgba(37,99,235,0.4)',
                }}
              >
                {uploading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'pfp-spin 0.7s linear infinite',
                      }}
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check size={15} /> Save photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────────────────── */}
      {deleteOpen && (
        <div
          onClick={() => setDeleteOpen(false)}
          style={{ ...backdropStyle, background: 'rgba(15,23,42,0.60)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 28px',
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
              border: '1px solid #E2E8F0',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                margin: '0 auto 18px',
              }}
            >
              <Trash2 size={22} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
              }}
            >
              Delete photo?
            </h3>
            <p style={{ margin: '10px 0 26px', fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
              Your photo will be removed and replaced with your initials. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: '#fff',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 12,
                  color: '#64748B',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteOpen(false);
                  onRemoved?.();
                }}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pfp-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />;
}

function MenuBtn({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        width: '100%',
        padding: '12px 18px',
        background: hovered
          ? danger
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(255,255,255,0.07)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: danger ? '#F87171' : '#E2E8F0',
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  background: 'rgba(0,0,0,0.90)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 22,
  right: 26,
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '50%',
  width: 42,
  height: 42,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#fff',
};
