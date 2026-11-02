import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mediaRoot } from "@/lib/media";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export async function GET(request: NextRequest, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  if (!/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|mp4|webm|mov)$/.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const full = path.join(mediaRoot(), file);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const stat = fs.statSync(full);
  const ext = file.split(".").pop()?.toLowerCase() || "";
  const type = MIME[ext] || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });

  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
      if (start <= end && start < stat.size) {
        const length = end - start + 1;
        const buffer = Buffer.alloc(length);
        const fd = fs.openSync(full, "r");
        try {
          fs.readSync(fd, buffer, 0, length, start);
        } finally {
          fs.closeSync(fd);
        }
        headers.set("Content-Range", `bytes ${start}-${end}/${stat.size}`);
        headers.set("Content-Length", String(length));
        return new NextResponse(new Uint8Array(buffer), { status: 206, headers });
      }
    }
    headers.set("Content-Range", `bytes */${stat.size}`);
    return new NextResponse(null, { status: 416, headers });
  }

  headers.set("Content-Length", String(stat.size));
  const data = fs.readFileSync(full);
  return new NextResponse(new Uint8Array(data), { status: 200, headers });
}
