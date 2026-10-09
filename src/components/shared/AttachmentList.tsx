import React, { useState } from 'react';
import type { Attachment } from '../../types';
import { fileUrl } from '../../lib/api';

interface AttachmentListProps {
  attachments: Attachment[];
  
  compact?: boolean;
}

function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/');
}

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
  const attachmentUrl = (attachment: Attachment) => (
    /^https?:\/\//i.test(attachment.path)
      ? attachment.path
      : fileUrl(`uploads/${attachment.filename}`)
  );
  const downloadUrl = (attachment: Attachment) => {
    if (!/^https?:\/\//i.test(attachment.path) || !attachment.path.includes('res.cloudinary.com/')) {
      return attachmentUrl(attachment);
    }
    const safeName = attachment.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return attachment.path.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
  };

  return (
    <>
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          {images.map((a, i) => {
            const src = attachmentUrl(a);
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

      {files.length > 0 && (
        <div className={`flex flex-wrap gap-1.5 ${images.length > 0 ? 'mt-2' : compact ? 'mt-2' : 'mt-3'}`}>
          {files.map((a, i) => (
            <a
              key={i}
              href={downloadUrl(a)}
              download={/^https?:\/\//i.test(a.path) ? undefined : a.originalName}
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

const FileIcon: React.FC<{ mimetype: string }> = ({ mimetype }) => {
  if (mimetype === 'application/pdf') return <span aria-hidden="true">📄</span>;
  if (mimetype.startsWith('text/')) return <span aria-hidden="true">📝</span>;
  if (mimetype.includes('word') || mimetype.includes('document')) return <span aria-hidden="true">📃</span>;
  return <span aria-hidden="true">📎</span>;
};
