import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "朗读工具",
  description: "输入文字并选择朗读模式，通过Web Speech API进行朗读",
}

export default function TtsLayout({ children }: { children: React.ReactNode }) {
  return children
}
