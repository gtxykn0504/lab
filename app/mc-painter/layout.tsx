import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Minecraft Painter",
  description: "Mc的像素画创作工具",
}

export default function PhotoLayout({ children }: { children: React.ReactNode }) {
  return children
}