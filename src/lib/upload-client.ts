/** Resize an image in the browser (max edge 1600px, JPEG) then upload it. Returns the public URL. */
export async function resizeImage(file: File, maxEdge = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", quality));
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const fd = new FormData();
  fd.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data.url as string;
}
