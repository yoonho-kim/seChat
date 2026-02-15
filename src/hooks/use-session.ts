"use client";

import { useState, useEffect } from "react";

interface Session {
  sessionId: string | null;
  role: string | null;
  displayName: string | null;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function useSession(): Session {
  const [session, setSession] = useState<Session>({
    sessionId: null,
    role: null,
    displayName: null,
  });

  useEffect(() => {
    setSession({
      sessionId: getCookie("session_id"),
      role: getCookie("session_role"),
      displayName: getCookie("session_name"),
    });
  }, []);

  return session;
}
