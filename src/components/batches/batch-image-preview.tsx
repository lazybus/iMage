"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";

interface BatchImagePreviewProps {
  filename: string;
  originalAlt: string;
  originalEmptyLabel: string;
  originalSrc: string | null;
  resultAlt: string;
  resultEmptyLabel: string;
  resultSrc: string | null;
}

function BeforeAfterSlider({
  filename,
  onOpen,
  originalAlt,
  originalSrc,
  resultAlt,
  resultSrc,
}: {
  filename: string;
  onOpen?: () => void;
  originalAlt: string;
  originalSrc: string;
  resultAlt: string;
  resultSrc: string;
}) {
  const [sliderValue, setSliderValue] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 10);
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const syncAspectRatio = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setAspectRatio(image.naturalWidth / image.naturalHeight);
    }
  };

  const updateSliderFromPointer = (clientX: number) => {
    const bounds = sliderRef.current?.getBoundingClientRect();

    if (!bounds || bounds.width === 0) {
      return;
    }

    const nextValue = ((clientX - bounds.left) / bounds.width) * 100;
    setSliderValue(Math.min(100, Math.max(0, nextValue)));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    updateSliderFromPointer(event.clientX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    updateSliderFromPointer(event.clientX);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    updateSliderFromPointer(event.clientX);
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="rounded-[24px] bg-white/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Before / after</p>
        <div className="flex items-center gap-3">
          <span className="muted text-sm">Drag on image to compare</span>
          {onOpen ? (
            <button className="button button-secondary px-4 py-2 text-sm" onClick={onOpen} type="button">
              Open lightbox
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-[18px] border border-black/8 bg-[rgba(255,255,255,0.72)]">
        <div
          className="relative w-full cursor-ew-resize select-none overflow-hidden touch-none bg-[rgba(243,239,230,0.82)]"
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setIsDragging(false)}
          onLostPointerCapture={() => setIsDragging(false)}
          ref={sliderRef}
          style={{ aspectRatio, cursor: isDragging ? "grabbing" : "ew-resize" }}
        >
          <div className="absolute inset-0">
            <Image
              alt={resultAlt}
              className="pointer-events-none object-contain"
              draggable={false}
              fill
              onLoad={syncAspectRatio}
              sizes="100vw"
              src={resultSrc}
            />
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-[rgba(18,24,19,0.72)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
              After
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
          >
            <Image
              alt={originalAlt}
              className="pointer-events-none object-contain"
              draggable={false}
              fill
              onLoad={syncAspectRatio}
              sizes="100vw"
              src={originalSrc}
            />
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-[rgba(18,24,19,0.72)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
              Before
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${sliderValue}% - 1px)` }}>
            <div className="relative h-full w-[2px] bg-white/95 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]">
              <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-lg text-[var(--foreground)] shadow-[0_10px_30px_rgba(17,24,18,0.18)]">
                <span aria-hidden="true">↔</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-black/8 px-4 py-3 text-sm">
          <span>{filename}</span>
          <span className="muted">{isDragging ? "Dragging" : "Drag the divider to reveal edits"}</span>
        </div>
      </div>
    </div>
  );
}

function SingleImagePreview({ alt, emptyLabel, label, src }: { alt: string; emptyLabel: string; label: string; src: string | null }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 10);

  const syncAspectRatio = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setAspectRatio(image.naturalWidth / image.naturalHeight);
    }
  };

  return (
    <div className="rounded-[24px] bg-white/60 p-4">
      <p className="eyebrow">{label}</p>
      {src ? (
        <div className="mt-3 overflow-hidden rounded-[18px] border border-black/8 bg-[rgba(255,255,255,0.72)]">
          <div className="relative w-full bg-[rgba(243,239,230,0.82)]" style={{ aspectRatio }}>
            <Image alt={alt} className="object-contain" draggable={false} fill onLoad={syncAspectRatio} sizes="100vw" src={src} />
          </div>
        </div>
      ) : (
        <div className="mt-3 flex min-h-[320px] items-center justify-center rounded-[18px] border border-black/8 bg-[rgba(255,255,255,0.72)] px-6 text-center text-sm muted">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export function BatchImagePreview({
  filename,
  originalAlt,
  originalEmptyLabel,
  originalSrc,
  resultAlt,
  resultEmptyLabel,
  resultSrc,
}: BatchImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const processedOriginalSrc = originalSrc ?? null;
  const processedResultSrc = resultSrc ?? null;
  const hasProcessedImage = processedOriginalSrc !== null && processedResultSrc !== null;
  const canOpen = Boolean(originalSrc || resultSrc);
  const modalLabel = hasProcessedImage ? "Before / after" : "Original image";
  const modalTitle = hasProcessedImage ? `Compare edits for ${filename}` : filename;

  const previewContent = hasProcessedImage ? (
    <BeforeAfterSlider
      filename={filename}
      onOpen={() => setIsOpen(true)}
      originalAlt={originalAlt}
      originalSrc={processedOriginalSrc}
      resultAlt={resultAlt}
      resultSrc={processedResultSrc}
    />
  ) : (
    <SingleImagePreview alt={originalAlt} emptyLabel={originalEmptyLabel} label="Original image" src={originalSrc} />
  );

  const modalContent = hasProcessedImage ? (
    <BeforeAfterSlider
      filename={filename}
      originalAlt={originalAlt}
      originalSrc={processedOriginalSrc}
      resultAlt={resultAlt}
      resultSrc={processedResultSrc}
    />
  ) : (
    <SingleImagePreview
      alt={resultSrc ? resultAlt : originalAlt}
      emptyLabel={resultSrc ? resultEmptyLabel : originalEmptyLabel}
      label={resultSrc ? "Returned image" : "Original image"}
      src={resultSrc ?? originalSrc}
    />
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {canOpen && !hasProcessedImage ? (
        <button className="block w-full text-left" onClick={() => setIsOpen(true)} type="button">
          <div className="transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(17,24,18,0.12)]">{previewContent}</div>
        </button>
      ) : (
        previewContent
      )}

      {isOpen && canOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,24,19,0.82)] p-4 backdrop-blur-sm sm:p-8"
          onClick={() => setIsOpen(false)}
          role="dialog"
        >
          <div className="panel w-full max-w-[min(96vw,1800px)] rounded-[30px] p-4 sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">{modalLabel}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{modalTitle}</h3>
              </div>
              <button className="button button-secondary" onClick={() => setIsOpen(false)} type="button">
                Close
              </button>
            </div>
            <div className="max-h-[82vh] overflow-auto rounded-[24px] bg-[rgba(255,255,255,0.72)] p-2 sm:p-4">{modalContent}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}