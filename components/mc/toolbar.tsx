"use client";

import React from "react"

import { Move, Paintbrush, Eraser, RotateCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  tool: "brush" | "eraser" | "pan";
  setTool: (tool: "brush" | "eraser" | "pan") => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  onReset: () => void;
  onExport: () => void;
}

const COLORS = [
  "#ffffff", // 白色
  "#e74c3c", // 红色
  "#e67e22", // 橙色
  "#f1c40f", // 黄色
  "#2ecc71", // 绿色
  "#3498db", // 蓝色
  "#9b59b6", // 紫色
  "#1abc9c", // 青色
  "#e91e63", // 粉色
  "#795548", // 棕色
  "#607d8b", // 蓝灰
];

export function Toolbar({
  tool,
  setTool,
  currentColor,
  setCurrentColor,
  onReset,
  onExport,
}: ToolbarProps) {
  return (
    <div className="fixed bottom-6 left-6 flex flex-col gap-3 z-50">
      {/* 工具按钮 */}
      <div className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-1.5 shadow-lg">
        <ToolButton
          active={tool === "pan"}
          onClick={() => setTool("pan")}
          tooltip="控制"
        >
          <Move className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={tool === "brush"}
          onClick={() => setTool("brush")}
          tooltip="画笔"
        >
          <Paintbrush className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={tool === "eraser"}
          onClick={() => setTool("eraser")}
          tooltip="橡皮擦"
        >
          <Eraser className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolButton onClick={onReset} tooltip="清空画布">
          <RotateCcw className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onExport} tooltip="导出图片">
          <Download className="w-4 h-4" />
        </ToolButton>
      </div>

      {/* 颜色选择器 */}
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <div className="grid grid-cols-6 gap-1.5">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-6 h-6 rounded transition-all",
                currentColor === color
                  ? "ring-2 ring-accent ring-offset-1 ring-offset-card scale-110"
                  : "hover:scale-105"
              )}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  tooltip?: string;
}

function ToolButton({ children, active, onClick, tooltip }: ToolButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "p-2 rounded-md transition-all",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
      onClick={onClick}
      title={tooltip}
    >
      {children}
    </button>
  );
}
