"use client";

import { useStream } from "../features/stream/useStream";

export default function StreamRenderer({
  url,
  enabled,
}: {
  url: string;
  enabled: boolean;
}) {
  useStream(url, enabled);

  if (!enabled) return null;

  return null;
}
