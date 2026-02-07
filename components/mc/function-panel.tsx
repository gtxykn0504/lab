"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, Code, Type, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseLatex,
  evaluateExplicit,
  checkGridCell,
} from "@/lib/latex-parser";

export interface FunctionItem {
  id: string;
  expression: string; // 原始输入（可以是 LaTeX）
  color: string;
  visible: boolean;
  isLatex: boolean; // 是否是 LaTeX 格式
}

interface FunctionPanelProps {
  functions: FunctionItem[];
  setFunctions: React.Dispatch<React.SetStateAction<FunctionItem[]>>;
  setPixels: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

const FUNCTION_COLORS = [
  "#ffffff", // 白色
  "#1a1a2e", // 深灰
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

export function FunctionPanel({ functions, setFunctions, setPixels }: FunctionPanelProps) {
  // 范围状态
  const [range, setRange] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  });
  const [isMarking, setIsMarking] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const addFunction = (isLatex: boolean = false) => {
    const newId = `fn-${Date.now()}`;
    const colorIndex = functions.length % FUNCTION_COLORS.length;
    // 新增函数时自动展开面板（如果当前是折叠的）
    if (collapsed) setCollapsed(false);
    setFunctions((prev) => [
      ...prev,
      {
        id: newId,
        expression: "",
        color: FUNCTION_COLORS[colorIndex],
        visible: true,
        isLatex,
      },
    ]);
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((fn) => fn.id !== id));
  };

  const updateFunction = (id: string, updates: Partial<FunctionItem>) => {
    setFunctions((prev) =>
      prev.map((fn) => (fn.id === id ? { ...fn, ...updates } : fn))
    );
  };

  const toggleVisibility = (id: string) => {
    setFunctions((prev) =>
      prev.map((fn) =>
        fn.id === id ? { ...fn, visible: !fn.visible } : fn
      )
    );
  };

  // 标记函数经过的格子
  const markFunctionGrids = (fn: FunctionItem) => {
    if (!fn.expression.trim()) return;
    
    setIsMarking(true);
    
    // 使用 setTimeout 让 UI 更新
    setTimeout(() => {
      try {
        const newPixels = new Map<string, string>();
        
        if (fn.isLatex) {
          // LaTeX 模式
          const parsed = parseLatex(fn.expression);
          
          if (parsed.type === "implicit") {
            // 隐式方程：检查每个格子
            for (let x = range.xMin; x <= range.xMax; x++) {
              for (let y = range.yMin; y <= range.yMax; y++) {
                if (checkGridCell(parsed.expression, x, y, 1)) {
                  newPixels.set(`${x},${y}`, fn.color);
                }
              }
            }
          } else {
            // 显式方程：对每个 x 计算 y
            for (let x = range.xMin; x <= range.xMax; x++) {
              // 在每个格子内多次采样以提高精度
              for (let subX = 0; subX < 1; subX += 0.1) {
                const mathY = evaluateExplicit(parsed.expression, x + subX);
                if (isFinite(mathY)) {
                  const gridY = Math.floor(mathY);
                  if (gridY >= range.yMin && gridY <= range.yMax) {
                    newPixels.set(`${x},${gridY}`, fn.color);
                  }
                }
              }
            }
          }
        } else {
          // 普通模式：作为 y = f(x) 处理
          for (let x = range.xMin; x <= range.xMax; x++) {
            for (let subX = 0; subX < 1; subX += 0.1) {
              try {
                let expr = fn.expression
                  .replace(/\bx\b/g, `(${x + subX})`)
                  .replace(/\bpi\b/gi, `(${Math.PI})`)
                  .replace(/\be\b/g, `(${Math.E})`)
                  .replace(/\bsin\b/gi, "Math.sin")
                  .replace(/\bcos\b/gi, "Math.cos")
                  .replace(/\btan\b/gi, "Math.tan")
                  .replace(/\babs\b/gi, "Math.abs")
                  .replace(/\bsqrt\b/gi, "Math.sqrt")
                  .replace(/\blog\b/gi, "Math.log")
                  .replace(/\bexp\b/gi, "Math.exp")
                  .replace(/\^/g, "**");
                
                const mathY = new Function(`return ${expr}`)();
                if (isFinite(mathY)) {
                  const gridY = Math.floor(mathY);
                  if (gridY >= range.yMin && gridY <= range.yMax) {
                    newPixels.set(`${x},${gridY}`, fn.color);
                  }
                }
              } catch {
                // 跳过无效表达式
              }
            }
          }
        }
        
        // 合并到现有像素
        setPixels((prev) => {
          const merged = new Map(prev);
          newPixels.forEach((color, key) => {
            merged.set(key, color);
          });
          return merged;
        });
      } catch (error) {
        console.error("标记失败:", error);
      } finally {
        setIsMarking(false);
      }
    }, 10);
  };

  return (
    <div className="fixed top-6 left-6 z-50 w-72">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg overflow-hidden">
        {/* 标题栏 */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border cursor-pointer"
          onClick={() => setCollapsed(!collapsed)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setCollapsed(!collapsed);
          }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCollapsed(!collapsed);
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? "展开函数面板" : "折叠函数面板"}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground">函数</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addFunction(false);
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="添加普通函数"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addFunction(true);
              }}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="添加 LaTeX 函数"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 折叠时隐藏以下内容 */}
        {!collapsed && (
          <>
            {/* 函数列表 */}
            <div className="max-h-64 overflow-y-auto">
              {functions.length === 0 ? (
                <div className="px-3 py-4 text-center text-muted-foreground text-xs">
                  <p>点击 <Type className="w-3 h-3 inline" /> 添加普通函数</p>
                  <p className="mt-1">点击 <Code className="w-3 h-3 inline" /> 添加 LaTeX 函数</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {functions.map((fn) => (
                    <div
                      key={fn.id}
                      className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md"
                    >
                      {/* 颜色选择 */}
                      <div className="relative">
                        <button
                          type="button"
                          className="w-5 h-5 rounded border border-border"
                          style={{ backgroundColor: fn.color }}
                          title="点击更换颜色"
                          onClick={() => {
                            const currentIndex = FUNCTION_COLORS.indexOf(fn.color);
                            const nextIndex =
                              (currentIndex + 1) % FUNCTION_COLORS.length;
                            updateFunction(fn.id, {
                              color: FUNCTION_COLORS[nextIndex],
                            });
                          }}
                        />
                      </div>

                      {/* 表达式输入 */}
                      <div className="flex-1 flex flex-col gap-1">
                        {fn.isLatex && (
                          <span className="text-[9px] text-accent font-medium">LaTeX</span>
                        )}
                        <input
                          type="text"
                          value={fn.expression}
                          onChange={(e) =>
                            updateFunction(fn.id, { expression: e.target.value })
                          }
                          placeholder={fn.isLatex ? "\\frac{x^2}{4}+\\frac{y^2}{9}=1" : "x^2 或 sin(x)"}
                          className={cn(
                            "w-full bg-input border border-border rounded px-2 py-1 text-xs font-mono",
                            "text-foreground placeholder:text-muted-foreground",
                            "focus:outline-none focus:ring-1 focus:ring-ring",
                            fn.isLatex && "border-accent/50"
                          )}
                        />
                      </div>

                      {/* 显示/隐藏 */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(fn.id)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          fn.visible
                            ? "text-foreground hover:bg-secondary"
                            : "text-muted-foreground hover:bg-secondary"
                        )}
                        title={fn.visible ? "隐藏" : "显示"}
                      >
                        {fn.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* 删除 */}
                      <button
                        type="button"
                        onClick={() => removeFunction(fn.id)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
                        title="删除"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* 其余控件（如范围/标记等）放在这里 */}
            {functions.length > 0 && (
              <div className="px-3 py-2 border-t border-border space-y-2">
                {/* 范围输入 */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="flex flex-col">
                    <label className="text-[9px] text-muted-foreground mb-0.5">X 最小</label>
                    <input
                      type="text"
                      value={range.xMin}
                      onChange={(e) => setRange((r) => ({ ...r, xMin: Number(e.target.value) || 0 }))}
                      className="w-full bg-input border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] text-muted-foreground mb-0.5">X 最大</label>
                    <input
                      type="text"
                      value={range.xMax}
                      onChange={(e) => setRange((r) => ({ ...r, xMax: Number(e.target.value) || 0 }))}
                      className="w-full bg-input border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] text-muted-foreground mb-0.5">Y 最小</label>
                    <input
                      type="text"
                      value={range.yMin}
                      onChange={(e) => setRange((r) => ({ ...r, yMin: Number(e.target.value) || 0 }))}
                      className="w-full bg-input border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] text-muted-foreground mb-0.5">Y 最大</label>
                    <input
                      type="text"
                      value={range.yMax}
                      onChange={(e) => setRange((r) => ({ ...r, yMax: Number(e.target.value) || 0 }))}
                      className="w-full bg-input border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* 标记按钮列表 */}
                <div className="space-y-1">
                  {functions.map((fn) => (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => markFunctionGrids(fn)}
                      disabled={isMarking || !fn.expression.trim()}
                      className={cn(
                        "w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                        "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      style={{ borderLeft: `3px solid ${fn.color}` }}
                    >
                      <Grid3X3 className="w-3 h-3" />
                      {isMarking ? "标记中..." : `标记 ${fn.isLatex ? "LaTeX" : "函数"} 格子`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
