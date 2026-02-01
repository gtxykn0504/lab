"use client";

import React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import {
  parseLatex,
  evaluateExplicit,
  evaluateImplicit,
} from "@/lib/latex-parser";

function evaluateExpression(expression: string, x: number): number {
  let expr = expression
    .replace(/\bx\b/g, `(${x})`)
    .replace(/\bpi\b/gi, `(${Math.PI})`)
    .replace(/\be\b/gi, `(${Math.E})`)
    .replace(/\bsin\b/gi, "Math.sin")
    .replace(/\bcos\b/gi, "Math.cos")
    .replace(/\btan\b/gi, "Math.tan")
    .replace(/\babs\b/gi, "Math.abs")
    .replace(/\bsqrt\b/gi, "Math.sqrt")
    .replace(/\blog\b/gi, "Math.log")
    .replace(/\blog10\b/gi, "Math.log10")
    .replace(/\bexp\b/gi, "Math.exp")
    .replace(/\bpow\b/gi, "Math.pow")
    .replace(/\bfloor\b/gi, "Math.floor")
    .replace(/\bceil\b/gi, "Math.ceil")
    .replace(/\bround\b/gi, "Math.round")
    .replace(/\^/g, "**");

  try {
    const fn = new Function(`return ${expr}`);
    return fn();
  } catch {
    return NaN;
  }
}

interface FunctionItem {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  isLatex: boolean;
}

interface PixelCanvasProps {
  pixels: Map<string, string>;
  setPixels: React.Dispatch<React.SetStateAction<Map<string, string>>>;
  offset: { x: number; y: number };
  setOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  tool: "brush" | "eraser" | "pan";
  currentColor: string;
  gridSize: number;
  functions: FunctionItem[];
}

export function PixelCanvas({
  pixels,
  setPixels,
  offset,
  setOffset,
  tool,
  currentColor,
  gridSize,
  functions,
}: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = dimensions;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    const startX = Math.floor(-offset.x / gridSize) - 1;
    const startY = Math.floor(-offset.y / gridSize) - 1;
    const endX = Math.ceil((width - offset.x) / gridSize) + 1;
    const endY = Math.ceil((height - offset.y) / gridSize) + 1;

    // 网格
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 1;

    for (let x = startX; x <= endX; x++) {
      const sx = x * gridSize + offset.x;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }

    for (let y = startY; y <= endY; y++) {
      const sy = y * gridSize + offset.y;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = "#4a4a6a";
    ctx.lineWidth = 2;

    if (offset.x >= 0 && offset.x <= width) {
      ctx.beginPath();
      ctx.moveTo(offset.x, 0);
      ctx.lineTo(offset.x, height);
      ctx.stroke();
    }

    if (offset.y >= 0 && offset.y <= height) {
      ctx.beginPath();
      ctx.moveTo(0, offset.y);
      ctx.lineTo(width, offset.y);
      ctx.stroke();
    }

    // 坐标数字
    ctx.fillStyle = "#6a6a8a";
    ctx.font = "11px Geist Mono, monospace";

    // X轴数字
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const xAxisLabelY =
      offset.y >= 0 && offset.y <= height
        ? Math.min(Math.max(offset.y + 4, 4), height - 16)
        : offset.y < 0
        ? 4
        : height - 16;

    for (let x = startX; x <= endX; x++) {
      if (x === 0) continue;
      const screenX = x * gridSize + offset.x + gridSize / 2;
      if (screenX > 30 && screenX < width - 10) {
        ctx.fillText(x.toString(), screenX, xAxisLabelY);
      }
    }

    // ✅ Y轴数字（修复版，不再随平移消失）
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const yAxisLabelX =
      offset.x >= 0 && offset.x <= width
        ? Math.min(Math.max(offset.x + 4, 4), width - 30)
        : offset.x < 0
        ? 4
        : width - 30;

    const firstY = Math.floor((offset.y - height) / gridSize);
    const lastY = Math.ceil(offset.y / gridSize);

    for (let y = firstY; y <= lastY; y++) {
      if (y === 0) continue;
      const screenY = offset.y - y * gridSize;
      if (screenY > 10 && screenY < height - 10) {
        ctx.fillText(y.toString(), yAxisLabelX, screenY);
      }
    }

    // 原点
    ctx.fillStyle = "#8a8aaa";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      "0",
      Math.min(Math.max(offset.x + 4, 4), width - 20),
      Math.min(Math.max(offset.y + 4, 4), height - 16)
    );

    // 函数绘制
    functions.forEach((fn) => {
      if (!fn.visible || !fn.expression.trim()) return;
      ctx.strokeStyle = fn.color;
      ctx.lineWidth = 2;

      if (fn.isLatex) {
        try {
          const parsed = parseLatex(fn.expression);
          if (parsed.type === "implicit") {
            drawImplicitCurve(
              ctx,
              parsed.expression,
              width,
              height,
              offset,
              gridSize,
              fn.color
            );
          } else {
            drawExplicitCurve(
              ctx,
              parsed.expression,
              width,
              height,
              offset,
              gridSize,
              true
            );
          }
        } catch {}
      } else {
        drawExplicitCurve(
          ctx,
          fn.expression,
          width,
          height,
          offset,
          gridSize,
          false
        );
      }
    });

    function drawExplicitCurve(
      ctx: CanvasRenderingContext2D,
      expression: string,
      width: number,
      height: number,
      offset: { x: number; y: number },
      gridSize: number,
      isLatex: boolean
    ) {
      ctx.beginPath();
      let first = true;

      for (let sx = 0; sx <= width; sx += 2) {
        const mx = (sx - offset.x) / gridSize;
        const my = isLatex
          ? evaluateExplicit(expression, mx)
          : evaluateExpression(expression, mx);

        if (isFinite(my)) {
          const sy = offset.y - my * gridSize;
          if (first) {
            ctx.moveTo(sx, sy);
            first = false;
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    function drawImplicitCurve(
      ctx: CanvasRenderingContext2D,
      expression: string,
      width: number,
      height: number,
      offset: { x: number; y: number },
      gridSize: number,
      color: string
    ) {
      ctx.strokeStyle = color;
      const step = 4;

      for (let sx = 0; sx < width; sx += step) {
        for (let sy = 0; sy < height; sy += step) {
          const x0 = (sx - offset.x) / gridSize;
          const y0 = -(sy - offset.y) / gridSize;
          const x1 = (sx + step - offset.x) / gridSize;
          const y1 = -(sy + step - offset.y) / gridSize;

          const v00 = evaluateImplicit(expression, x0, y0);
          const v10 = evaluateImplicit(expression, x1, y0);
          const v01 = evaluateImplicit(expression, x0, y1);
          const v11 = evaluateImplicit(expression, x1, y1);

          if (
            !isFinite(v00) ||
            !isFinite(v10) ||
            !isFinite(v01) ||
            !isFinite(v11)
          )
            continue;

          const config =
            (v00 > 0 ? 8 : 0) +
            (v10 > 0 ? 4 : 0) +
            (v11 > 0 ? 2 : 0) +
            (v01 > 0 ? 1 : 0);

          if (config === 0 || config === 15) continue;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + step, sy + step);
          ctx.stroke();
        }
      }
    }

    // 像素
    pixels.forEach((color, key) => {
      const [x, y] = key.split(",").map(Number);
      const sx = x * gridSize + offset.x;
      const sy = -y * gridSize + offset.y - gridSize;
      ctx.fillStyle = color;
      ctx.fillRect(sx + 1, sy + 1, gridSize - 2, gridSize - 2);
    });
  }, [dimensions, offset, gridSize, pixels, functions]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 坐标换算
  const getGridCoord = (cx: number, cy: number) => {
    const x = Math.floor((cx - offset.x) / gridSize);
    const y = -Math.floor((cy - offset.y) / gridSize) - 1;
    return { x, y };
  };

  const handlePixel = (cx: number, cy: number) => {
    const { x, y } = getGridCoord(cx, cy);
    const key = `${x},${y}`;

    if (tool === "brush") {
      setPixels((p) => new Map(p).set(key, currentColor));
    } else if (tool === "eraser") {
      setPixels((p) => {
        const n = new Map(p);
        n.delete(key);
        return n;
      });
    }
  };

  // 鼠标 & 触摸事件（与你原版一致）
  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan" || e.button === 1) {
      setIsPanning(true);
      setLastPanPos({ x: e.clientX, y: e.clientY });
    } else {
      setIsDrawing(true);
      handlePixel(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset((o) => ({
        x: o.x + e.clientX - lastPanPos.x,
        y: o.y + e.clientY - lastPanPos.y,
      }));
      setLastPanPos({ x: e.clientX, y: e.clientY });
    } else if (isDrawing) {
      handlePixel(e.clientX, e.clientY);
    }
  };

  const stop = () => {
    setIsDrawing(false);
    setIsPanning(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="fixed inset-0"
      style={{ cursor: tool === "pan" ? "grab" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stop}
      onMouseLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}
