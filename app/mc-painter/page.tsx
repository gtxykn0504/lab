"use client";

import { useState, useCallback } from "react";
import { PixelCanvas } from "@/components/mc/pixel-canvas";
import { Toolbar } from "@/components/mc/toolbar";
import { CoordinatesDisplay } from "@/components/mc/coordinates-display";
import { FunctionPanel, type FunctionItem } from "@/components/mc/function-panel";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CoordinateInputDialog } from "@/components/mc/coordinate-input-dialog";

export default function PixelPainter() {
  const [pixels, setPixels] = useState<Map<string, string>>(new Map());
  const [offset, setOffset] = useState({ x: 400, y: 300 });
  const [tool, setTool] = useState<"brush" | "eraser" | "pan">("brush");
  const [currentColor, setCurrentColor] = useState("#2ecc71");
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [emptyCanvasDialogOpen, setEmptyCanvasDialogOpen] = useState(false);
  const [coordinateDialogOpen, setCoordinateDialogOpen] = useState(false);
  const gridSize = 24;

  const handleReset = useCallback(() => {
    setResetDialogOpen(true);
  }, []);

  const confirmReset = useCallback(() => {
    setPixels(new Map());
    setOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, []);

  const handleCoordinateHighlight = useCallback((x: number, y: number) => {
    const key = `${x},${y}`;
    setPixels((p) => new Map(p).set(key, currentColor));
  }, [currentColor]);

  const handleExport = useCallback(() => {
    if (pixels.size === 0) {
      setEmptyCanvasDialogOpen(true);
      return;
    }

    // 计算边界
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    pixels.forEach((_, key) => {
      const [x, y] = key.split(",").map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });

    const padding = 1;
    const width = (maxX - minX + 1 + padding * 2) * gridSize;
    const height = (maxY - minY + 1 + padding * 2) * gridSize;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 背景
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // 绘制格子线（先画线，再画像素块）
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 1;
    
    // 垂直线
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // 水平线
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 绘制像素块（带清晰边框）
    pixels.forEach((color, key) => {
      const [x, y] = key.split(",").map(Number);
      const screenX = (x - minX + padding) * gridSize;
      const screenY = (maxY - y + padding) * gridSize;
      
      // 填充颜色
      ctx.fillStyle = color;
      ctx.fillRect(screenX + 1, screenY + 1, gridSize - 2, gridSize - 2);
      
      // 绘制像素块边框（深色描边）
      ctx.strokeStyle = "#0a0a15";
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + 0.5, screenY + 0.5, gridSize - 1, gridSize - 1);
    });

    // 下载
    const link = document.createElement("a");
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [pixels, gridSize]);

  return (
    <main className="w-screen h-screen overflow-hidden relative">
      <PixelCanvas
        pixels={pixels}
        setPixels={setPixels}
        offset={offset}
        setOffset={setOffset}
        tool={tool}
        currentColor={currentColor}
        gridSize={gridSize}
        functions={functions}
      />
      <Toolbar
        tool={tool}
        setTool={setTool}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        onReset={handleReset}
        onExport={handleExport}
      />
      <CoordinatesDisplay offset={offset} gridSize={gridSize} onOpenCoordinateDialog={() => setCoordinateDialogOpen(true)} />
      <FunctionPanel functions={functions} setFunctions={setFunctions} setPixels={setPixels} />
      <Dialog open={resetDialogOpen} onOpenChange={(open) => !open && setResetDialogOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认清空画布</DialogTitle>
            <DialogDescription>确定要清空当前画布吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="sm">取消</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button size="sm" onClick={confirmReset}>清空</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={emptyCanvasDialogOpen} onOpenChange={(open) => !open && setEmptyCanvasDialogOpen(false)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>提示</DialogTitle>
            <DialogDescription>画布为空，请先绘制一些像素！</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm">好的</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CoordinateInputDialog
        open={coordinateDialogOpen}
        onClose={() => setCoordinateDialogOpen(false)}
        onConfirm={handleCoordinateHighlight}
        initialX={0}
        initialY={0}
      />
    </main>
  );
}
