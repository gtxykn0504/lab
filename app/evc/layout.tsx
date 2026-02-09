import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "数学期望与方差计算器",
  description: "计算数据的数学期望与方差，用户可以输入X与P的分布列进行计算",
}

export default function EvcLayout({ children }: { children: React.ReactNode }) {
  return children
}
