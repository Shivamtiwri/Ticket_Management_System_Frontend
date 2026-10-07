import React, { useState } from 'react';
import type { Attachment } from '../../types';

interface AttachmentListProps {
  attachments: Attachment[];
  /** Compact list style for use inside comment bubbles (no image grid, smaller images) */
  compact?: boolean;
}

function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

/** Full-screen lightbox for previewing an image */
const Lightbox: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
    aria-label={`Image preview: ${alt}`}
  >
    <button
      className="absolute top-4 right-4 text-white text-2xl font-bold leading-none hover:text-gray-300 focus:outline-none"
      onClick={onClose}
      aria-label="Close preview"
    >
      ✕
    </button>
    <img
      src={src}
      alt={alt}
      className="max-h-[90vh] max-w-full rounded shadow-xl object-contain"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

export const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, compact = false }) => {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState('');

  if (!attachments || attachments.length === 0) return null;

  const images = attachments.filter((a) => isImage(a.mimetype));
  const files = attachments.filter((a) => !isImage(a.mimetype));

  const openLightbox = (src: string, alt: string) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
  };

  return (
    <>
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          {images.map((a, i) => {
            const src = `/uploads/${a.filename}`;
            const imgSize = compact ? 'h-20 w-20' : 'h-32 w-32';
            return (
              <button
                key={i}
                type="button"
                className={`${imgSize} flex-shrink-0 rounded overflow-hidden border border-gray-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-opacity`}
                onClick={() => openLightbox(src, a.originalName)}
                aria-label={`View image: ${a.originalName}`}
                title={a.originalName}
              >
                <img
                  src={src}
                  alt={a.originalName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Non-image file links */}
      {files.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${images.length > 0 ? 'mt-2' : compact ? 'mt-2' : 'mt-3'}`}>
          {files.map((a, i) => (
            <a
              key={i}
              href={`/uploads/${a.filename}`}
              download={a.originalName}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 px-2 py-1 rounded border border-blue-100"
              title={`Download ${a.originalName}`}
            >
              <FileIcon mimetype={a.mimetype} />
              {a.originalName}
            </a>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <Lightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
};

/** Small icon hinting at the file type */
const FileIcon: React.FC<{ mimetype: string }> = ({ mimetype }) => {
  if (mimetype === 'application/pdf') return <span aria-hidden="true">📄</span>;
  if (mimetype.startsWith('text/')) return <span aria-hidden="true">📝</span>;
  if (mimetype.includes('word') || mimetype.includes('document')) return <span aria-hidden="true">📃</span>;
  return <span aria-hidden="true">📎</span>;
};
