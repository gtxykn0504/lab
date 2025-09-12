"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, Check, Plus, Trash2, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Institution {
  id: string
  name: string
  subjects: { code: string; name: string }[]
}

interface CodeItem {
  id: string
  institutionId: string
  institutionName: string
  subjects: string[]
  subjectNames: string[]
}

const institutions: Institution[] = [
  {
    id: "1",
    name: "鼓一小",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
    ],
  },
  {
    id: "2",
    name: "福州19中",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
      { code: "E", name: "期末、期中考" },
      { code: "F", name: "物理" },
    ],
  },
  {
    id: "3",
    name: "知惑",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "物理" },
      { code: "E", name: "化学" },
    ],
  },
  {
    id: "4",
    name: "学而思",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
    ],
  },
  {
    id: "5",
    name: "九色鹿",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
    ],
  },
  {
    id: "6",
    name: "特殊（其他）",
    subjects: [{ code: "X", name: "特殊文件" }],
  },
  {
    id: "7",
    name: "符老师",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
    ],
  },
  {
    id: "8",
    name: "兰老师",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
    ],
  },
  {
    id: "9",
    name: "北京14中",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
      { code: "E", name: "期末、期中考等考试" },
      { code: "F", name: "物理" },
      { code: "G", name: "寒假与暑假" },
    ],
  },
  {
    id: "10",
    name: "郭老师（初中）",
    subjects: [{ code: "A", name: "数学" }],
  },
  {
    id: "11",
    name: "159中（高中）",
    subjects: [
      { code: "A", name: "语文" },
      { code: "B", name: "数学" },
      { code: "C", name: "英语" },
      { code: "D", name: "除三科以外科目" },
      { code: "E", name: "期末、期中考" },
      { code: "F", name: "假期" },
    ],
  },
]

const locations = [
  { code: "BJ", name: "北京" },
  { code: "FZ", name: "福州" },
  { code: "CH", name: "其他（中国内）" },
  { code: "AO", name: "其他（国外）" },
]

export default function FileEncoder() {
  const [date, setDate] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [codeItems, setCodeItems] = useState<CodeItem[]>([])
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState("")

  // 设置默认日期为今天
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]
    setDate(today)
  }, [])

  const addCodeItem = () => {
    const newItem: CodeItem = {
      id: Date.now().toString(),
      institutionId: "",
      institutionName: "",
      subjects: [],
      subjectNames: [],
    }
    setCodeItems([...codeItems, newItem])
  }

  const removeCodeItem = (id: string) => {
    setCodeItems(codeItems.filter((item) => item.id !== id))
  }

  const updateCodeItem = (id: string, field: keyof CodeItem, value: any) => {
    setCodeItems(
      codeItems.map((item) => {
        if (item.id === id) {
          if (field === "institutionId") {
            const institution = institutions.find((inst) => inst.id === value)
            return {
              ...item,
              institutionId: value,
              institutionName: institution?.name || "",
              subjects: [],
              subjectNames: [],
            }
          }
          return { ...item, [field]: value }
        }
        return item
      }),
    )
  }

  const updateSubjects = (itemId: string, subjectCode: string, checked: boolean) => {
    setCodeItems(
      codeItems.map((item) => {
        if (item.id === itemId) {
          const institution = institutions.find((inst) => inst.id === item.institutionId)
          const subject = institution?.subjects.find((s) => s.code === subjectCode)

          if (checked) {
            return {
              ...item,
              subjects: [...item.subjects, subjectCode],
              subjectNames: [...item.subjectNames, subject?.name || ""],
            }
          } else {
            const subjectIndex = item.subjects.indexOf(subjectCode)
            return {
              ...item,
              subjects: item.subjects.filter((code) => code !== subjectCode),
              subjectNames: item.subjectNames.filter((_, index) => index !== subjectIndex),
            }
          }
        }
        return item
      }),
    )
  }

  const generateCodes = () => {
    setError("")

    // 验证基本条件
    if (!date) {
      setError("请选择日期")
      return
    }

    if (!selectedLocation) {
      setError("请选择入库地点")
      return
    }

    if (codeItems.length === 0) {
      setError("请至少添加一个编码项目")
      return
    }

    // 处理日期，去除月份和日期的前导0
    let formattedDate = date
    if (date) {
      const [year, month, day] = date.split("-")
      formattedDate = `${year}${parseInt(month, 10)}${parseInt(day, 10)}`
    }
    const codes: string[] = []
    const validItems: CodeItem[] = []

    // 检查每个项目的有效性
    codeItems.forEach((item, index) => {
      if (!item.institutionId) {
        setError(`项目 ${index + 1} 未选择机构`)
        return
      }

      if (item.subjects.length === 0) {
        setError(`项目 ${index + 1} 未选择科目`)
        return
      }

      validItems.push(item)
    })

    // 如果有错误，停止生成
    if (error) return

    // 生成编码
    validItems.forEach((item, index) => {
      const typeCode = item.institutionId + item.subjects.sort().join("")
      const sequenceNumber = (index + 1).toString().padStart(2, "0")
      const code = `${formattedDate}${typeCode}${selectedLocation}${sequenceNumber}`
      codes.push(code)
    })

    setGeneratedCodes(codes)

    if (codes.length === 0) {
      setError("未能生成任何编码，请检查项目设置")
    }
  }

  const copyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  const copyAllCodes = async () => {
    try {
      await navigator.clipboard.writeText(generatedCodes.join("\n"))
      setCopiedIndex(-1)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error("Failed to copy codes:", err)
    }
  }

  const exportCodes = () => {
    const content = generatedCodes.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `文件编码_${date.replace(/-/g, "")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0]
    setDate(today)
    setSelectedLocation("")
    setCodeItems([])
    setGeneratedCodes([])
    setError("")
  }

  // 检查是否可以生成编码
  const canGenerate =
    date &&
    selectedLocation &&
    codeItems.length > 0 &&
    codeItems.some((item) => item.institutionId && item.subjects.length > 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">文件编码批量生成器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 公共设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="date">日期 *</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>入库地点 *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择入库地点" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.code} value={location.code}>
                      {location.code}: {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 编码项目列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">编码项目</Label>
              <Button onClick={addCodeItem} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                添加项目
              </Button>
            </div>

            {codeItems.map((item, index) => {
              const institution = institutions.find((inst) => inst.id === item.institutionId)
              return (
                <Card key={item.id} className="p-4 border-l-4 border-l-primary/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm bg-primary/10 px-2 py-1 rounded">
                        项目 {index + 1} (编码序号: {(index + 1).toString().padStart(2, "0")})
                      </span>
                      <Button onClick={() => removeCodeItem(item.id)} size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm">机构 *</Label>
                        <Select
                          value={item.institutionId}
                          onValueChange={(value) => updateCodeItem(item.id, "institutionId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="请选择机构" />
                          </SelectTrigger>
                          <SelectContent>
                            {institutions.map((institution) => (
                              <SelectItem key={institution.id} value={institution.id}>
                                {institution.id}. {institution.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {institution && institution.subjects.length > 0 && (
                        <div>
                          <Label className="text-sm">科目 * (可多选)</Label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 p-3 bg-muted/20 rounded">
                            {institution.subjects.map((subject) => (
                              <div key={subject.code} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${item.id}-${subject.code}`}
                                  checked={item.subjects.includes(subject.code)}
                                  onCheckedChange={(checked) =>
                                    updateSubjects(item.id, subject.code, checked as boolean)
                                  }
                                />
                                <Label htmlFor={`${item.id}-${subject.code}`} className="text-xs">
                                  {subject.code}: {subject.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          {item.subjects.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-2">
                              已选择: {item.subjects.sort().join("")} ({item.subjectNames.join(", ")})
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}

            {codeItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>暂无编码项目，点击"添加项目"开始创建</p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button onClick={generateCodes} className="flex-1" disabled={!canGenerate}>
              生成编码 ({codeItems.filter((item) => item.institutionId && item.subjects.length > 0).length} 个有效项目)
            </Button>
            <Button onClick={resetForm} variant="outline">
              重置
            </Button>
          </div>

          {/* 生成结果 */}
          {generatedCodes.length > 0 && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-green-800 dark:text-green-200">
                  ✅ 成功生成 {generatedCodes.length} 个文件编码
                </Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={copyAllCodes}>
                    {copiedIndex === -1 ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        已复制全部
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        复制全部
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={exportCodes}>
                    <Download className="h-4 w-4 mr-1" />
                    导出
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded border"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-lg font-bold text-green-700 dark:text-green-300">{code}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        项目 {index + 1}: {codeItems[index]?.institutionName} -{" "}
                        {codeItems[index]?.subjectNames.join(", ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        格式: {date.replace(/-/g, "")} + {codeItems[index]?.institutionId}
                        {codeItems[index]?.subjects.sort().join("")} + {selectedLocation} +{" "}
                        {(index + 1).toString().padStart(2, "0")}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => copyCode(code, index)}>
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          复制
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
