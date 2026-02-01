"use client";

import { useEffect, useState } from "react";

interface CoordinatesDisplayProps {
  offset: { x: number; y: number };
  gridSize: number;
}

export function CoordinatesDisplay({
  offset,
  gridSize,
}: CoordinatesDisplayProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [gridPos, setGridPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      const gridX = Math.floor((e.clientX - offset.x) / gridSize);
      const gridY = -Math.floor((e.clientY - offset.y) / gridSize) - 1;
      setGridPos({ x: gridX, y: gridY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [offset, gridSize]);

  return (
    <div className="fixed top-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg z-50">
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">X:</span>
          <span className="text-foreground w-8 text-right">{gridPos.x}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Y:</span>
          <span className="text-foreground w-8 text-right">{gridPos.y}</span>
        </div>
      </div>
    </div>
  );
}
