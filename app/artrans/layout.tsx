import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Artrans 评论可视化",
  description: "可视化Artrans评论数据，包括评论内容、用户信息和评论时间",
}

export default function PhotoLayout({ children }: { children: React.ReactNode }) {
  return children
}