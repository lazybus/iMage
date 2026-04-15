"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";

interface BatchImagePreviewProps {
  filename: string;
  originalAlt: string;
  originalEmptyLabel: string;
  originalSrc: string | null;
  resultAlt: string;
  resultEmptyLabel: string;
  resultSrc: string | null;
}

const LIGHTBOX_MEDIA_EDGE_BUFFER = 12;

function getViewportFitSize(aspectRatio: number, bounds: { height: number; width: number } | null) {
  if (!bounds) {
    return null;
  }

  const maxWidth = Math.max(0, bounds.width - LIGHTBOX_MEDIA_EDGE_BUFFER);
  const maxHeight = Math.max(0, bounds.height - LIGHTBOX_MEDIA_EDGE_BUFFER);

  if (maxWidth === 0 || maxHeight === 0) {
    return null;
  }

  const viewportAspectRatio = maxWidth / maxHeight;

  if (aspectRatio >= viewportAspectRatio) {
    return {
      height: Math.floor(maxWidth / aspectRatio),
      maxHeight,
      maxWidth,
      width: Math.floor(maxWidth),
    };
  }

  return {
    height: Math.floor(maxHeight),
    maxHeight,
    maxWidth,
    width: Math.floor(maxHeight * aspectRatio),
  };
}

function FullscreenIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M8 4H5a1 1 0 0 0-1 1v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M4 16v3a1 1 0 0 0 1 1h3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function BeforeAfterSlider({
  filename,
  fitBounds,
  fitWithinViewport = false,
  onOpen,
  originalAlt,
  originalSrc,
  resultAlt,
  resultSrc,
}: {
  filename: string;
  fitBounds?: { height: number; width: number } | null;
  fitWithinViewport?: boolean;
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

  const viewportFitSize = fitWithinViewport ? getViewportFitSize(aspectRatio, fitBounds ?? null) : null;

  const sliderStyle = fitWithinViewport
    ? {
        aspectRatio,
        cursor: isDragging ? "grabbing" : "ew-resize",
        width: viewportFitSize ? `${viewportFitSize.width}px` : "100%",
        height: viewportFitSize ? `${viewportFitSize.height}px` : undefined,
        maxWidth: viewportFitSize ? `${viewportFitSize.maxWidth}px` : "100%",
        maxHeight: viewportFitSize ? `${viewportFitSize.maxHeight}px` : "100%",
      }
    : {
        aspectRatio,
        cursor: isDragging ? "grabbing" : "ew-resize",
      };

  return (
    <div className="surface-soft rounded-[24px] p-4">
      <p className="eyebrow">Before / after</p>
      <div className="surface-strong border-theme mt-3 overflow-hidden rounded-[18px] border">
        <div className={fitWithinViewport ? "surface-muted flex items-center justify-center p-3 sm:p-4" : "surface-muted"}>
          <div
            className="relative w-full cursor-ew-resize select-none overflow-hidden touch-none"
            onDragStart={(event) => event.preventDefault()}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => setIsDragging(false)}
            onLostPointerCapture={() => setIsDragging(false)}
            ref={sliderRef}
            style={sliderStyle}
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
              <div className="overlay-ink pointer-events-none absolute right-3 top-3 rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
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
              <div className="overlay-ink pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] text-white">
                Before
              </div>
            </div>
            <div className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${sliderValue}% - 1px)` }}>
              <div className="overlay-contrast relative h-full w-[2px] shadow-[0_0_0_1px_var(--line)]">
                <div className="panel absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-lg text-[var(--foreground)] shadow-[0_10px_30px_rgba(17,24,18,0.18)]">
                  <span aria-hidden="true">↔</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-theme flex items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <span>{filename}</span>
          {onOpen ? (
            <button
              aria-label={`Open ${filename} in lightbox`}
              className="surface-strong border-theme inline-flex h-10 w-10 items-center justify-center rounded-full border text-[var(--foreground)] transition hover:-translate-y-0.5 hover-surface"
              onClick={onOpen}
              type="button"
            >
              <FullscreenIcon />
            </button>
          ) : (
            <span className="muted">{isDragging ? "Dragging" : "Drag the divider to compare"}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SingleImagePreview({
  alt,
  emptyLabel,
  fitBounds,
  fitWithinViewport = false,
  label,
  src,
}: {
  alt: string;
  emptyLabel: string;
  fitBounds?: { height: number; width: number } | null;
  fitWithinViewport?: boolean;
  label: string;
  src: string | null;
}) {
  const [aspectRatio, setAspectRatio] = useState(16 / 10);

  const syncAspectRatio = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      setAspectRatio(image.naturalWidth / image.naturalHeight);
    }
  };

  const viewportFitSize = fitWithinViewport ? getViewportFitSize(aspectRatio, fitBounds ?? null) : null;

  const imageStyle = fitWithinViewport
    ? {
        aspectRatio,
        width: viewportFitSize ? `${viewportFitSize.width}px` : "100%",
        height: viewportFitSize ? `${viewportFitSize.height}px` : undefined,
        maxWidth: viewportFitSize ? `${viewportFitSize.maxWidth}px` : "100%",
        maxHeight: viewportFitSize ? `${viewportFitSize.maxHeight}px` : "100%",
      }
    : { aspectRatio };

  return (
    <div className="surface-soft rounded-[24px] p-4">
      <p className="eyebrow">{label}</p>
      {src ? (
        <div className="surface-strong border-theme mt-3 overflow-hidden rounded-[18px] border">
          <div className={fitWithinViewport ? "surface-muted flex items-center justify-center p-3 sm:p-4" : "surface-muted"}>
            <div className="relative w-full" style={imageStyle}>
              <Image alt={alt} className="object-contain" draggable={false} fill onLoad={syncAspectRatio} sizes="100vw" src={src} />
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-strong border-theme mt-3 flex min-h-[320px] items-center justify-center rounded-[18px] border px-6 text-center text-sm muted">
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
  const [modalBounds, setModalBounds] = useState<{ height: number; width: number } | null>(null);
  const modalContentRef = useRef<HTMLDivElement | null>(null);

  const processedOriginalSrc = originalSrc ?? null;
  const processedResultSrc = resultSrc ?? null;
  const hasProcessedImage = processedOriginalSrc !== null && processedResultSrc !== null;
  const canOpen = Boolean(originalSrc || resultSrc);
  const canRenderPortal = typeof document !== "undefined";
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
      fitBounds={modalBounds}
      fitWithinViewport
      originalAlt={originalAlt}
      originalSrc={processedOriginalSrc}
      resultAlt={resultAlt}
      resultSrc={processedResultSrc}
    />
  ) : (
    <SingleImagePreview
      alt={resultSrc ? resultAlt : originalAlt}
      emptyLabel={resultSrc ? resultEmptyLabel : originalEmptyLabel}
      fitBounds={modalBounds}
      fitWithinViewport
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const element = modalContentRef.current;

    if (!element) {
      return;
    }

    const updateBounds = () => {
      setModalBounds({ height: element.clientHeight, width: element.clientWidth });
    };

    updateBounds();

    const observer = new ResizeObserver(updateBounds);
    observer.observe(element);

    return () => {
      observer.disconnect();
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

      {canRenderPortal && isOpen && canOpen
        ? createPortal(
            <div
              aria-modal="true"
              className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-[rgba(8,11,9,0.82)] p-4 backdrop-blur-sm sm:p-8"
              onClick={() => setIsOpen(false)}
              role="dialog"
            >
              <div
                className="panel mx-auto flex max-h-[calc(100vh-2rem)] w-full max-w-[min(96vw,1800px)] flex-col rounded-[30px] p-4 sm:max-h-[calc(100vh-4rem)] sm:p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">{modalLabel}</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{modalTitle}</h3>
                  </div>
                  <button className="button button-secondary" onClick={() => setIsOpen(false)} type="button">
                    Close
                  </button>
                </div>
                <div
                  className="surface-strong min-h-0 flex flex-1 items-center justify-center overflow-hidden rounded-[24px] p-2 sm:p-4"
                  ref={modalContentRef}
                >
                  {modalContent}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}