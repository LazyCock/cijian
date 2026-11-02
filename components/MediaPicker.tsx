"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";
import type { MediaItem } from "@/lib/media-types";
import { MAX_MEDIA_ITEMS, MAX_VIDEO_SECONDS } from "@/lib/media-types";

const IMAGE_MAX = 20 * 1024 * 1024;
const VIDEO_MAX = 250 * 1024 * 1024;

async function imageDimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const dimensions = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dimensions;
}

async function compressImage(file: File) {
  if (file.type === "image/gif") return file;
  const { width, height } = await imageDimensions(file);
  const scale = Math.min(1, 1920 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  const bitmap = await createImageBitmap(file);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}

function videoDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(url);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取视频信息"));
    };
    video.src = url;
  });
}

export function MediaPicker({ value, onChange }: { value: MediaItem[]; onChange: (value: MediaItem[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadOne(file: File): Promise<MediaItem> {
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.media) throw new Error(data.error || "上传失败");
    return data.media as MediaItem;
  }

  async function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    const slots = MAX_MEDIA_ITEMS - value.length;
    if (slots <= 0) {
      setError("最多只能发布 9 个图片或视频");
      return;
    }

    setUploading(true);
    const next = [...value];
    try {
      for (const file of files.slice(0, slots)) {
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) {
          throw new Error("只支持图片或视频文件");
        }
        if (isImage && file.size > IMAGE_MAX) throw new Error("单张图片不能超过 20MB");
        if (isVideo && file.size > VIDEO_MAX) throw new Error("视频源文件不能超过 250MB");
        if (isVideo) {
          const duration = await videoDuration(file).catch(() => 0);
          if (duration > MAX_VIDEO_SECONDS + 0.25) {
            throw new Error("视频不能超过 1 分钟，请先裁剪后再上传");
          }
        }
        const prepared = isImage ? await compressImage(file) : file;
        const media = await uploadOne(prepared);
        next.push(media);
        onChange([...next]);
      }
      if (files.length > slots) setError("最多只能发布 9 个图片或视频，超出的文件未上传");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="media-picker">
      <div className="media-picker-head">
        <div>
          <b>图片 / 视频</b>
          <span>支持图片和视频混排，视频自动压缩，时长不超过 1 分钟</span>
        </div>
        <span className="media-count">{value.length} / {MAX_MEDIA_ITEMS}</span>
      </div>

      {value.length > 0 && (
        <div className="media-grid">
          {value.map((item, index) => (
            <figure className="media-tile" key={item.id}>
              {item.kind === "video" ? (
                <video src={item.url} poster={item.posterUrl} preload="metadata" muted playsInline controls />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={`已上传图片 ${index + 1}`} />
              )}
              <span className="media-badge">{item.kind === "video" ? `视频 ${Math.round(item.duration || 0)}s` : "图片"}</span>
              <button type="button" className="media-remove" onClick={() => remove(index)} aria-label="移除">×</button>
            </figure>
          ))}
        </div>
      )}

      <div className="media-actions">
        <button type="button" className="btn btn-light btn-sm" disabled={uploading || value.length >= MAX_MEDIA_ITEMS} onClick={() => inputRef.current?.click()}>
          <Icon name="i-plus" />{uploading ? "压缩 / 上传中…" : "添加图片或视频"}
        </button>
        <span className="media-hint">最多 9 个 · 视频 ≤ 1 分钟</span>
        <input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={choose} />
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
