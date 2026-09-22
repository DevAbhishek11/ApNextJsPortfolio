"use client";

import { useState } from "react";
import { ImagePlus, RefreshCcw } from "lucide-react";
import MediaPicker from "./media-picker";
import { cn } from "@/lib/utils";

/** Single-image input backed by the media library. */
export default function ImageInput({
  value,
  onChange,
  label = "Choose image",
  aspect = "aspect-[16/8]",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className={cn(
          "group relative flex w-full items-center justify-center overflow-hidden rounded-control border border-dashed border-adm-border-strong bg-adm-surface-2 text-adm-faint transition-colors hover:border-accent hover:text-accent",
          aspect,
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
            <img src={value} alt="Selected" className="h-full w-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-control bg-adm-surface px-3 py-1.5 text-xs font-semibold text-adm-text">
                <RefreshCcw size={12} /> Replace
              </span>
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 py-4">
            <ImagePlus size={22} />
            <span className="text-xs font-medium">{label}</span>
          </span>
        )}
      </button>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => onChange(url)}
      />
    </div>
  );
}
