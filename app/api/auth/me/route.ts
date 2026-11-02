import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user: user
      ? { id: user.id, name: user.name, handle: user.handle, avatarUrl: user.avatarUrl, role: user.role }
      : null,
  });
}
