"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface CoordinateInputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (x: number, y: number) => void;
  initialX?: number;
  initialY?: number;
}

export function CoordinateInputDialog({
  open,
  onClose,
  onConfirm,
  initialX = 0,
  initialY = 0,
}: CoordinateInputDialogProps) {
  const [x, setX] = React.useState(initialX.toString());
  const [y, setY] = React.useState(initialY.toString());

  React.useEffect(() => {
    if (open) {
      setX(initialX.toString());
      setY(initialY.toString());
    }
  }, [open, initialX, initialY]);

  const handleConfirm = () => {
    const numX = parseInt(x, 10);
    const numY = parseInt(y, 10);
    if (!isNaN(numX) && !isNaN(numY)) {
      onConfirm(numX, numY);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-medium text-foreground mb-4">
          设置高亮坐标
        </h3>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-8">X:</label>
            <Input
              type="text"
              value={x}
              onChange={(e) => setX(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              placeholder="输入 X 坐标"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground w-8">Y:</label>
            <Input
              type="text"
              value={y}
              onChange={(e) => setY(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              placeholder="输入 Y 坐标"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}
