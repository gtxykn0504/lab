"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: "confirm" | "alert";
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  variant = "confirm",
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6">
        {title && (
          <h3 className="text-lg font-medium text-foreground mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-muted-foreground mb-6">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2">
          {variant === "confirm" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              {cancelText}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
