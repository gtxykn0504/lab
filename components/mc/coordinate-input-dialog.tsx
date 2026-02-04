"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>设置高亮坐标</DialogTitle>
          <DialogDescription>输入要高亮显示的坐标位置</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">取消</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button size="sm" onClick={handleConfirm}>确认</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
