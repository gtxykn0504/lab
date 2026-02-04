"use client"

import React from "react"

import { useState, useMemo } from "react"
import { Upload, Search, Edit2, Save, X, FileJson, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Comment {
  id: string
  rid: string
  content: string
  ip: string
  created_at: string
  nick: string
  email: string
  link: string
  badge_name: string
  page_key: string
  page_title: string
  site_name: string
  site_urls: string
  // 排除的字段
  ua?: string
  is_collapsed?: string
  is_pending?: string
  is_pinned?: string
  vote_up?: string
  vote_down?: string
  badge_color?: string
  updated_at?: string
  page_admin_only?: string
}

type SearchField = "all" | "content" | "ip" | "created_at" | "email" | "nick" | "page_key" | "site_name"

export default function ArtransViewer() {
  const [comments, setComments] = useState<Comment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchField, setSearchField] = useState<SearchField>("all")
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        let text = e.target?.result as string
        // 尝试修复常见的 JSON 格式问题（如尾随逗号）
        text = text.replace(/,\s*]/g, "]").replace(/,\s*}/g, "}")
        const json = JSON.parse(text)
        setComments(Array.isArray(json) ? json : [json])
      } catch (err) {
        console.log("[v0] JSON parse error:", err)
        alert("JSON 解析失败，请检查文件格式。提示：" + (err as Error).message)
      }
    }
    reader.readAsText(file)
  }

  const filteredComments = useMemo(() => {
    if (!searchQuery.trim()) return comments

    const query = searchQuery.toLowerCase()
    return comments.filter((comment) => {
      if (searchField === "all") {
        return (
          comment.content?.toLowerCase().includes(query) ||
          comment.ip?.toLowerCase().includes(query) ||
          comment.created_at?.toLowerCase().includes(query) ||
          comment.email?.toLowerCase().includes(query) ||
          comment.nick?.toLowerCase().includes(query) ||
          comment.page_key?.toLowerCase().includes(query) ||
          comment.site_name?.toLowerCase().includes(query)
        )
      }
      const fieldValue = comment[searchField]
      return fieldValue?.toLowerCase().includes(query)
    })
  }, [comments, searchQuery, searchField])

  const handleEdit = (comment: Comment) => {
    setEditingComment({ ...comment })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!editingComment) return

    setComments((prev) =>
      prev.map((c) => (c.id === editingComment.id ? editingComment : c))
    )
    setIsDialogOpen(false)
    setEditingComment(null)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(comments, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "artrans-backup-modified.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const stripHtml = (html: string) => {
    const div = document.createElement("div")
    div.innerHTML = html
    return div.textContent || div.innerText || ""
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredComments.map((c) => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条评论吗？`)) {
      setComments((prev) => prev.filter((c) => !selectedIds.has(c.id)))
      setSelectedIds(new Set())
    }
  }

  const isAllSelected = filteredComments.length > 0 && filteredComments.every((c) => selectedIds.has(c.id))

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-foreground">Artrans 评论可视化</h1>
            </div>
            <p className="text-muted-foreground">请先将Artrans修改后缀为JSON</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 上传、统计与搜索区域 */}
        <Card className="mb-8 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* 上传和统计 */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button className="gap-2" size="lg" asChild>
                      <div>
                        <Upload className="h-4 w-4" />
                        <span>上传 JSON 文件</span>
                      </div>
                    </Button>
                  </label>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5">
                    <FileJson className="h-3.5 w-3.5 mr-1.5" />
                    {comments.length} 条评论
                  </Badge>
                  {selectedIds.size > 0 && (
                    <Badge variant="default" className="text-sm px-3 py-1.5">
                      已选择 {selectedIds.size} 条
                    </Badge>
                  )}
                </div>
                <div className="flex gap-3">
                  {selectedIds.size > 0 && (
                    <Button onClick={handleBatchDelete} variant="destructive" size="lg" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      删除选中
                    </Button>
                  )}
                  {comments.length > 0 && (
                    <Button onClick={handleExport} variant="outline" size="lg" className="gap-2 bg-transparent">
                      <Save className="h-4 w-4" />
                      导出修改后的 JSON
                    </Button>
                  )}
                </div>
              </div>

              {/* 搜索 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入搜索关键词..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <Select
                  value={searchField}
                  onValueChange={(value) => setSearchField(value as SearchField)}
                >
                  <SelectTrigger className="w-full sm:w-[180px] h-11">
                    <SelectValue placeholder="搜索字段" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部字段</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="ip">IP</SelectItem>
                    <SelectItem value="created_at">Created At</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="nick">Nick</SelectItem>
                    <SelectItem value="page_key">Page Key</SelectItem>
                    <SelectItem value="site_name">Site Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground">
                  找到 <span className="font-semibold text-primary">{filteredComments.length}</span> 条匹配结果
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 评论列表 */}
        {comments.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-20">
              <div className="text-center text-muted-foreground">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                  <FileJson className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground mb-2">请上传 Artrans 导出的 JSON 文件</p>
                <p className="text-sm">支持查看、搜索和编辑评论内容</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredComments.length > 0 && (
              <div className="flex items-center gap-3 mb-4 px-1">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  全选 / 取消全选
                </Label>
              </div>
            )}
            <div className="grid gap-5">
              {filteredComments.map((comment) => (
                <Card key={comment.id} className="overflow-hidden hover:shadow-md transition-shadow shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Checkbox
                          checked={selectedIds.has(comment.id)}
                          onCheckedChange={(checked) => handleSelectOne(comment.id, checked as boolean)}
                          className="shrink-0"
                        />
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg shrink-0">
                          {comment.nick?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                            <span className="truncate">{comment.nick || "匿名"}</span>
                            {comment.badge_name && (
                              <Badge variant="secondary" className="text-xs">
                                {comment.badge_name}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground truncate">
                            {comment.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(comment)}
                        className="shrink-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className="prose prose-sm max-w-none text-foreground mb-5 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">ID</span>
                      <span className="text-foreground">{comment.id}</span>
                      {comment.rid !== "0" && (
                        <span className="text-muted-foreground"> (回复 #{comment.rid})</span>
                      )}
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">IP</span>
                      <span className="text-foreground">{comment.ip}</span>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">创建时间</span>
                      <span className="text-foreground">{comment.created_at}</span>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">链接</span>
                      <a
                        href={comment.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block font-medium"
                      >
                        {comment.link || "-"}
                      </a>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">页面</span>
                      <span className="text-foreground truncate block" title={comment.page_title}>
                        {comment.page_key}
                      </span>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">页面标题</span>
                      <span className="text-foreground truncate block">{comment.page_title}</span>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">站点名</span>
                      <span className="text-foreground">{comment.site_name}</span>
                    </div>
                    <div className="bg-accent/50 rounded-lg px-3 py-2.5 border border-border/50">
                      <span className="text-muted-foreground block mb-1 font-medium">站点 URL</span>
                      <a
                        href={comment.site_urls}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block font-medium"
                      >
                        {comment.site_urls}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          </>
        )}
      </main>

      {/* 编辑弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑评论 #{editingComment?.id}</DialogTitle>
          </DialogHeader>
          {editingComment && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nick">昵称</Label>
                <Input
                  id="nick"
                  value={editingComment.nick}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, nick: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  value={editingComment.email}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">内容 (HTML)</Label>
                <Textarea
                  id="content"
                  value={editingComment.content}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, content: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ip">IP</Label>
                <Input
                  id="ip"
                  value={editingComment.ip}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, ip: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="link">链接</Label>
                <Input
                  id="link"
                  value={editingComment.link}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, link: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="created_at">创建时间</Label>
                <Input
                  id="created_at"
                  value={editingComment.created_at}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, created_at: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="page_key">页面 Key</Label>
                  <Input
                    id="page_key"
                    value={editingComment.page_key}
                    onChange={(e) =>
                      setEditingComment({ ...editingComment, page_key: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="page_title">页面标题</Label>
                  <Input
                    id="page_title"
                    value={editingComment.page_title}
                    onChange={(e) =>
                      setEditingComment({ ...editingComment, page_title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="site_name">站点名</Label>
                  <Input
                    id="site_name"
                    value={editingComment.site_name}
                    onChange={(e) =>
                      setEditingComment({ ...editingComment, site_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="site_urls">站点 URL</Label>
                  <Input
                    id="site_urls"
                    value={editingComment.site_urls}
                    onChange={(e) =>
                      setEditingComment({ ...editingComment, site_urls: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="badge_name">徽章名称</Label>
                <Input
                  id="badge_name"
                  value={editingComment.badge_name}
                  onChange={(e) =>
                    setEditingComment({ ...editingComment, badge_name: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
