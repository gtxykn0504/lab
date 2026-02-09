import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "文件编码批量生成器",
  description: "按类型生成对应的文件编码内容",
}

export default function FileLayout({ children }: { children: React.ReactNode }) {
  return children
}