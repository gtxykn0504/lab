"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const COLORS = [
  "#ffffff", "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db",
  "#9b59b6", "#1abc9c", "#e91e63", "#795548", "#607d8b", "#12d1ef",
];

const colorToIndex = (color: string): number => {
  return COLORS.indexOf(color);
};

const indexToColor = (index: number): string => {
  return COLORS[index] || "#2ecc71";
};

const encodePixelsToUrl = (pixels: Map<string, string>): string => {
  if (pixels.size === 0) return "";
  
  const entries = Array.from(pixels.entries()).sort((a, b) => {
    const [ax, ay] = a[0].split(",").map(Number);
    const [bx, by] = b[0].split(",").map(Number);
    return ay - by || ax - bx;
  });
  
  let result = "";
  let prevX = 0;
  let prevY = 0;
  
  entries.forEach(([key, color]) => {
    const [x, y] = key.split(",").map(Number);
    const colorIndex = colorToIndex(color);
    
    const dx = x - prevX;
    const dy = y - prevY;
    
    result += `${dx},${dy},${colorIndex};`;
    
    prevX = x;
    prevY = y;
  });
  
  return btoa(result);
};

const decodeUrlToPixels = (encoded: string): Map<string, string> => {
  const pixels = new Map<string, string>();
  
  try {
    const decoded = atob(encoded);
    const entries = decoded.split(";").filter(e => e);
    
    let x = 0;
    let y = 0;
    
    entries.forEach(entry => {
      const [dx, dy, colorIndex] = entry.split(",").map(Number);
      x += dx;
      y += dy;
      const color = indexToColor(colorIndex);
      pixels.set(`${x},${y}`, color);
    });
  } catch (e) {
    console.error("Failed to decode pixels from URL:", e);
  }
  
  return pixels;
};

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixels: Map<string, string>;
}

export function ShareDialog({ open, onOpenChange, pixels }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const pixelsKey = useMemo(() => {
    return Array.from(pixels.entries()).sort().join("|");
  }, [pixels]);

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      onOpenChange(false);
    }).catch(() => {
      console.error("Failed to copy URL");
    });
  }, [shareUrl, onOpenChange]);

  useEffect(() => {
    if (open && pixels.size > 0) {
      const encoded = encodePixelsToUrl(pixels);
      setIsLoading(true);
      setError("");
      
      fetch('/api/short-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: encoded }),
      })
        .then(res => res.json())
        .then(result => {
          if (result.success && result.short_url) {
            setShareUrl(result.short_url);
          } else {
            setError(result.error || 'Failed to create short link');
          }
        })
        .catch(err => {
          console.error('Error creating short link:', err);
          setError('Failed to create short link');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, pixelsKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享像素画</DialogTitle>
          <DialogDescription>复制下方链接分享给其他人</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              placeholder={isLoading ? "正在生成短链接..." : ""}
              className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">关闭</Button>
          </DialogClose>
          <Button 
            onClick={handleCopyUrl} 
            size="sm"
            disabled={!shareUrl || isLoading}
          >
            {isLoading ? "生成中..." : "复制"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useUrlPixels(): Map<string, string> {
  const [pixels, setPixels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get("data");
    
    if (data) {
      try {
        const decodedPixels = decodeUrlToPixels(data);
        if (decodedPixels.size > 0) {
          setPixels(decodedPixels);
        }
      } catch (e) {
        console.error("Failed to decode pixels from URL:", e);
      }
    }
  }, []);

  return pixels;
}
