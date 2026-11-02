import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { MediaItem, MediaKind } from "./media-types";
import { MAX_VIDEO_SECONDS } from "./media-types";

const IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const VIDEO_TYPES = new Map([
  ["video/mp4", "mp4"],
  ["video/quicktime", "mov"],
  ["video/webm", "webm"],
]);

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export class MediaError extends Error {}

export function mediaRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads"));
}

function binary(name: "ffmpeg" | "ffprobe") {
  const configured = name === "ffmpeg" ? process.env.FFMPEG_PATH : process.env.FFPROBE_PATH;
  if (configured) return configured;
  const local = path.join(
    process.cwd(),
    "tools",
    "ffmpeg",
    "bin",
    process.platform === "win32" ? `${name}.exe` : name,
  );
  if (fs.existsSync(local)) return local;
  return name;
}

function run(command: string, args: string[], timeoutMs = 180_000) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new MediaError("视频处理超时，请换一个更短的视频"));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 2_000_000) stdout = stdout.slice(-2_000_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 2_000_000) stderr = stderr.slice(-2_000_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new MediaError(`无法启动视频处理工具：${error.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new MediaError(`视频处理失败（${code}）`));
    });
  });
}

async function probe(file: string) {
  const { stdout } = await run(
    binary("ffprobe"),
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file],
    30_000,
  );
  const data = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ codec_type?: string; width?: number; height?: number; duration?: string }>;
  };
  const video = data.streams?.find((stream) => stream.codec_type === "video");
  return {
    duration: Number(data.format?.duration ?? video?.duration ?? 0),
    width: video?.width,
    height: video?.height,
  };
}

function publicUrl(filename: string) {
  return `/api/media/${filename}`;
}

export async function storeMedia(file: File): Promise<MediaItem> {
  const mime = file.type || "application/octet-stream";
  const imageExt = IMAGE_TYPES.get(mime);
  const videoExt = VIDEO_TYPES.get(mime);
  if (!imageExt && !videoExt) {
    throw new MediaError("只支持 JPG、PNG、WebP、GIF 图片，或 MP4、MOV、WebM 视频");
  }
  const kind: MediaKind = imageExt ? "image" : "video";
  const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > maxBytes) {
    throw new MediaError(kind === "image" ? "单张图片不能超过 20MB" : "视频源文件不能超过 250MB");
  }

  const root = mediaRoot();
  fs.mkdirSync(root, { recursive: true });
  const id = randomUUID();
  const input = path.join(root, `${id}-input.${imageExt || videoExt}`);
  fs.writeFileSync(input, Buffer.from(await file.arrayBuffer()));

  try {
    if (kind === "image") {
      const filename = `${id}.${imageExt}`;
      const output = path.join(root, filename);
      fs.renameSync(input, output);
      let meta: { width?: number; height?: number } = {};
      try {
        const info = await probe(output);
        meta = { width: info.width, height: info.height };
      } catch {}
      return {
        id,
        kind,
        url: publicUrl(filename),
        mime,
        width: meta.width,
        height: meta.height,
        size: file.size,
      };
    }

    const info = await probe(input);
    if (!info.duration || info.duration > MAX_VIDEO_SECONDS + 0.25) {
      throw new MediaError("视频不能超过 1 分钟，请先裁剪后再上传");
    }

    const filename = `${id}.mp4`;
    const output = path.join(root, filename);
    await run(binary("ffmpeg"), [
      "-y",
      "-i",
      input,
      "-t",
      String(MAX_VIDEO_SECONDS),
      "-vf",
      "scale='min(1280,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-maxrate",
      "2M",
      "-bufsize",
      "4M",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      output,
    ]);

    const posterName = `${id}-poster.jpg`;
    const poster = path.join(root, posterName);
    try {
      await run(binary("ffmpeg"), [
        "-y",
        "-ss",
        "0.4",
        "-i",
        output,
        "-frames:v",
        "1",
        "-vf",
        "scale=640:-2",
        poster,
      ], 30_000);
    } catch {
      // A video without a poster still plays; the UI falls back to a video tile.
    }

    const final = fs.statSync(output);
    const dimensions = await probe(output).catch(() => ({ width: info.width, height: info.height, duration: info.duration }));
    return {
      id,
      kind,
      url: publicUrl(filename),
      mime: "video/mp4",
      width: dimensions.width,
      height: dimensions.height,
      duration: Number(dimensions.duration.toFixed(2)),
      posterUrl: fs.existsSync(poster) ? publicUrl(posterName) : undefined,
      size: final.size,
    };
  } finally {
    try {
      if (fs.existsSync(input)) fs.unlinkSync(input);
    } catch {}
  }
}
