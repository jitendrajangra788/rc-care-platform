"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Camera, ImageIcon, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  title?: string;
  hint?: string;
  captureMode?: "environment" | "user";
  className?: string;
  previewClassName?: string;
  showFrame?: boolean;
};

export type PhotoCaptureHandle = {
  open: () => void;
};

function readFile(file: File, onChange: (dataUrl: string | null) => void) {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => onChange(String(reader.result));
  reader.readAsDataURL(file);
}

export const PhotoCapture = forwardRef<PhotoCaptureHandle, Props>(
  function PhotoCapture(
    {
      value,
      onChange,
      title = "Take or upload photo",
      hint = "Tap to choose Camera or Gallery",
      captureMode = "environment",
      className,
      previewClassName,
      showFrame = true,
    },
    ref,
  ) {
    const cameraRef = useRef<HTMLInputElement>(null);
    const galleryRef = useRef<HTMLInputElement>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => openSheet(),
    }));

    useEffect(() => {
      if (!sheetOpen) return;
      const id = requestAnimationFrame(() => setVisible(true));
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeSheet();
      };
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }, [sheetOpen]);

    function openSheet() {
      setVisible(false);
      setSheetOpen(true);
    }

    function closeSheet() {
      setVisible(false);
      window.setTimeout(() => setSheetOpen(false), 180);
    }

    function pickCamera() {
      closeSheet();
      window.setTimeout(() => cameraRef.current?.click(), 220);
    }

    function pickGallery() {
      closeSheet();
      window.setTimeout(() => galleryRef.current?.click(), 220);
    }

    return (
      <div className={cn("space-y-2", className)}>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture={captureMode}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file, onChange);
            e.target.value = "";
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file, onChange);
            e.target.value = "";
          }}
        />

        {showFrame ? (
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-paper-2/40">
            {value ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={value}
                  alt="Attendance photo preview"
                  className={cn(
                    "h-52 w-full object-cover sm:h-56",
                    previewClassName,
                  )}
                />
                <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-[#172d3a]/85 to-transparent p-3 pt-10">
                  <button
                    type="button"
                    onClick={openSheet}
                    className="btn btn-primary btn-sm flex-1 justify-center"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="btn btn-outline btn-sm justify-center border-white/30 bg-white/10 text-white hover:bg-white/20"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-success">
                  Photo ready
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={openSheet}
                className="flex w-full flex-col items-center justify-center gap-2 px-4 py-8 text-center transition hover:bg-[var(--secondary)] active:scale-[0.995]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-white shadow-[0_12px_28px_rgba(8,127,140,0.28)]">
                  <Camera className="h-7 w-7" />
                </span>
                <p className="text-base font-semibold text-heading">{title}</p>
                <p className="max-w-xs text-sm text-muted">{hint}</p>
                <span className="mt-1 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                  <Camera className="h-3.5 w-3.5" /> Camera
                  <span className="text-muted">·</span>
                  <ImageIcon className="h-3.5 w-3.5" /> Gallery
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={openSheet}
              className="btn btn-primary w-full justify-center"
            >
              <Camera className="h-4 w-4" />
              {value ? "Change photo" : "Add photo"}
            </button>
            {value ? (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="w-full text-center text-xs font-semibold text-danger"
              >
                Remove photo
              </button>
            ) : null}
          </div>
        )}

        {sheetOpen ? (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <button
              type="button"
              aria-label="Close photo options"
              className={cn(
                "absolute inset-0 bg-[#172d3a]/45 backdrop-blur-[2px] transition-opacity duration-200",
                visible ? "opacity-100" : "opacity-0",
              )}
              onClick={closeSheet}
            />
            <div
              className={cn(
                "relative z-[101] w-full max-w-[420px] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-200 ease-out sm:pb-3",
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0 sm:translate-y-3",
              )}
            >
              <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface shadow-[0_20px_50px_rgba(23,45,58,0.22)]">
                <div className="border-b border-[var(--line)] bg-[var(--secondary)] px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-heading">Attendance photo</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Camera preferred · gallery also allowed
                  </p>
                </div>

                <button
                  type="button"
                  onClick={pickCamera}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--secondary)] active:bg-[var(--primary-soft)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white">
                    <Camera className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-heading">Camera</span>
                    <span className="block text-xs text-muted">Live site photo for check-in</span>
                  </span>
                </button>

                <div className="mx-4 h-px bg-[var(--line)]" />

                <button
                  type="button"
                  onClick={pickGallery}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[var(--secondary)] active:bg-[var(--primary-soft)]"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-base font-semibold text-heading">Photo gallery</span>
                    <span className="block text-xs text-muted">Upload an existing image</span>
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={closeSheet}
                className="mt-2 w-full rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface px-4 py-3.5 text-center text-base font-semibold text-heading shadow-[var(--shadow-xs)] transition hover:bg-paper-2 active:bg-[var(--secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
