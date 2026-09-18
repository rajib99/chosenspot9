"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/upload-client";

type Props = { value: string[]; onChange: (urls: string[]) => void; multiple?: boolean; label?: string; reorderable?: boolean };

export function ImageDropzone({ value, onChange, multiple = false, label = "Drag photos here or click to browse", reorderable = false }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);

  async function handle(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return toast.error("Please choose image files.");
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of multiple ? list : list.slice(0, 1)) urls.push(await uploadImage(f));
      onChange(multiple ? [...value, ...urls] : urls);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const move = (i: number, d: number) => {
    const next = [...value];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
        className={cn("flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white px-4 py-8 text-center text-sm text-ink-soft transition-colors hover:border-emerald", over && "border-emerald bg-emerald-light")}
      >
        {busy ? "Uploading…" : label}
        <span className="mt-1 text-xs text-ink-muted">JPG, PNG or WebP · resized automatically</span>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden data-testid="dropzone-input" onChange={(e) => e.target.files && handle(e.target.files)} />
      </div>
      {value.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {value.map((url, i) => (
            <li key={url + i} className="group relative overflow-hidden rounded-xl border border-line bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
              {reorderable && i === 0 && <span className="absolute left-2 top-2 rounded-full bg-emerald px-2 py-0.5 text-[10px] font-medium text-white">Primary</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 text-[11px] text-white opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                <span className="flex gap-1">
                  {reorderable && i > 0 && <button type="button" onClick={() => move(i, -1)} className="rounded bg-black/40 px-1.5 py-0.5">{i === 1 ? "Make primary" : "←"}</button>}
                  {reorderable && i < value.length - 1 && i > 0 && <button type="button" onClick={() => move(i, 1)} className="rounded bg-black/40 px-1.5 py-0.5">→</button>}
                </span>
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="rounded bg-black/40 px-1.5 py-0.5">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
