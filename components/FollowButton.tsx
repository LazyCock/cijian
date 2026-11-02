"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

export function FollowButton({ handle, initialFollowing, isAuthenticated }: { handle: string; initialFollowing: boolean; isAuthenticated: boolean }) {
  const pathname = usePathname() || "/";
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!isAuthenticated) {
      window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
      return;
    }
    setPending(true);
    const next = !following;
    setFollowing(next);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(handle)}/follow`, { method: "POST" });
      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(pathname)}`;
        return;
      }
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFollowing(data.following);
    } catch {
      setFollowing(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button className={`btn btn-light btn-sm follow-profile ${following ? "is-following" : ""}`} type="button" onClick={toggle} disabled={pending}>
      {following ? <><Icon name="i-check" />已关注</> : <><Icon name="i-plus" />关注</>}
    </button>
  );
}
