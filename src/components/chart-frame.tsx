"use client";

import { ReactNode, useEffect, useState } from "react";

export function ChartFrame({
  className = "",
  children
}: {
  className?: string;
  children: (size: { width: number; height: number }) => ReactNode;
}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return (
    <div className={`chart-box ${className}`} ref={setElement}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
