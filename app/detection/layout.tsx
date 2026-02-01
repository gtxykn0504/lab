import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "设备检测器",
  description: "检测当前设备的屏幕尺寸、类型和响应式断点",
}

export default function PhotoLayout({ children }: { children: React.ReactNode }) {
  return children
}