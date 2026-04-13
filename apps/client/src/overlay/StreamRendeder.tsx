"use client";

import { useEffect } from "react";
import { useStream } from "../features/stream/useStream";

export default function StreamRenderer({
  url,
  enabled,
}: {
  url: string;
  enabled: boolean;
}) {
  useStream(url, enabled);

  return null;
}
