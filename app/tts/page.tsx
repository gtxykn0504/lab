"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PauseCircle, PlayCircle, ArrowLeft, Eye, EyeOff, SkipForward } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

type ReadMode = "full" | "segment"
type ViewMode = "input" | "reading"

interface VoiceInfo {
  name: string
  lang: string
  displayName: string
}

export default function TTSTool() {
  const [text, setText] = useState<string>("")
  const [mode, setMode] = useState<ReadMode>("full")
  const [viewMode, setViewMode] = useState<ViewMode>("input")
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [hideFullText, setHideFullText] = useState<boolean>(false)
  const [currentSegment, setCurrentSegment] = useState<number>(0)
  const [segments, setSegments] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [speed, setSpeed] = useState<number>(1)
  const [pitch, setPitch] = useState<number>(1)
  const [hideAllSegments, setHideAllSegments] = useState<boolean>(false)
  const [hiddenSegments, setHiddenSegments] = useState<boolean[]>([])
  const [voices, setVoices] = useState<VoiceInfo[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>("")
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isManualStopRef = useRef<boolean>(false)
  const synthRef = useRef<typeof window.speechSynthesis | null>(null)

  // 初始化语音合成器和语音列表
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
      
      // 获取可用语音列表
      const populateVoiceList = () => {
        const voices = window.speechSynthesis.getVoices()
        const voiceList = voices
          .map(voice => ({
            name: voice.name,
            lang: voice.lang,
            displayName: voice.name.startsWith("Microsoft") 
              ? voice.name.replace(/Microsoft (.+) Online.*- (.+)/, "$1 $2")
              : voice.name
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
        
        setVoices(voiceList)
        
        // 默认选择中文语音
        const chineseVoice = voiceList.find(v => v.lang.includes('zh') || v.lang.includes('CN'))
        if (chineseVoice) {
          setSelectedVoice(chineseVoice.name)
        } else if (voiceList.length > 0) {
          setSelectedVoice(voiceList[0].name)
        }
      }
      
      populateVoiceList()
      
      // 监听语音列表变化
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoiceList
      }
    } else {
      setError("您的浏览器不支持语音合成功能")
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // 切换所有分段的显示/隐藏
  const toggleAllSegments = () => {
    const newHideAllSegments = !hideAllSegments
    setHideAllSegments(newHideAllSegments)
    
    if (newHideAllSegments) {
      setHiddenSegments(Array(segments.length).fill(true))
    } else {
      setHiddenSegments(Array(segments.length).fill(false))
    }
  }

  // 切换单个分段的显示/隐藏
  const toggleSegment = (index: number) => {
    setHiddenSegments(prev => {
      if (prev.length === 0) {
        const newArray = Array(segments.length).fill(false)
        newArray[index] = true
        return newArray
      }
      const newArray = [...prev]
      newArray[index] = !newArray[index]
      return newArray
    })
  }

  // 判断单个分段是否应该显示
  const shouldShowSegment = (index: number): boolean => {
    if (hiddenSegments.length <= index) return true
    return !hiddenSegments[index]
  }

  // 分割文本为段落
  const splitTextIntoSegments = (input: string): string[] => {
    if (!input.trim()) return []
    
    // 改进分割逻辑，保留标点符号
    const segmentEndings = /([，。！？；,.!?:;]+)/g
    const parts = input.split(segmentEndings)
    
    const result: string[] = []
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i].trim()) {
        const segment = parts[i].trim() + (parts[i + 1] || '')
        result.push(segment)
      }
    }
    
    setHiddenSegments(Array(result.length).fill(false))
    setHideAllSegments(false)
    return result
  }

  // 朗读文本
  const speak = (text: string, onEnd?: () => void) => {
    if (!text.trim() || !synthRef.current) return
    
    isManualStopRef.current = false
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 设置语音
    if (selectedVoice) {
      const voices = window.speechSynthesis.getVoices()
      const selectedVoiceObj = voices.find(v => v.name === selectedVoice)
      if (selectedVoiceObj) {
        utterance.voice = selectedVoiceObj
      }
    }
    
    utterance.lang = "zh-CN"
    utterance.rate = speed
    utterance.pitch = pitch
    utterance.volume = 1
    
    utterance.onstart = () => {
      setIsPlaying(true)
      setError(null)
    }
    
    utterance.onend = () => {
      setIsPlaying(false)
      onEnd?.()
    }
    
    utterance.onerror = (event) => {
      setIsPlaying(false)
      if (event.error === 'interrupted' && isManualStopRef.current) {
        return
      }
      setError(`朗读失败: ${event.error}`)
    }
    
    speechRef.current = utterance
    synthRef.current.speak(utterance)
  }

  // 开始朗读
  const handleStartReading = () => {
    if (!text.trim()) {
      setError("请输入要朗读的文本")
      return
    }
    
    setError(null)
    setCurrentSegment(0)
    setViewMode("reading")
    setHideFullText(false)
    
    if (mode === "segment") {
      const textSegments = splitTextIntoSegments(text)
      setSegments(textSegments)
    }
  }

  // 停止朗读
  const handleStopReading = () => {
    if (synthRef.current) {
      isManualStopRef.current = true
      synthRef.current.cancel()
      setIsPlaying(false)
    }
  }

  // 播放下一句
  const handlePlayNext = () => {
    if (mode === "segment" && currentSegment < segments.length - 1) {
      handleStopReading()
      const nextSegment = currentSegment + 1
      setCurrentSegment(nextSegment)
      setTimeout(() => {
        speak(segments[nextSegment])
      }, 100)
    }
  }

  // 调整语速
  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0]
    setSpeed(newSpeed)
    if (speechRef.current && synthRef.current?.speaking) {
      handleStopReading()
      setTimeout(() => {
        if (mode === "full") {
          speak(text)
        } else if (segments[currentSegment]) {
          speak(segments[currentSegment])
        }
      }, 100)
    }
  }

  // 调整音调
  const handlePitchChange = (value: number[]) => {
    const newPitch = value[0]
    setPitch(newPitch)
    if (speechRef.current && synthRef.current?.speaking) {
      handleStopReading()
      setTimeout(() => {
        if (mode === "full") {
          speak(text)
        } else if (segments[currentSegment]) {
          speak(segments[currentSegment])
        }
      }, 100)
    }
  }

  // 返回输入页面
  const handleBackToInput = () => {
    handleStopReading()
    setViewMode("input")
    setCurrentSegment(0)
    setSegments([])
    setHiddenSegments([])
    setHideFullText(false)
    setHideAllSegments(false)
  }

  // 清空
  const handleClear = () => {
    setText("")
    setSegments([])
    setCurrentSegment(0)
    setHiddenSegments([])
    setHideAllSegments(false)
    handleStopReading()
  }

  // 获取当前语音的显示名称
  const getSelectedVoiceDisplayName = () => {
    if (!selectedVoice) return "默认语音"
    const voice = voices.find(v => v.name === selectedVoice)
    return voice ? voice.displayName : "默认语音"
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-b from-primary/5 to-transparent px-4 py-6 sm:py-12">
        <div className="container mx-auto">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">朗读工具</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">基于浏览器 SpeechSynthesis API 的朗读工具</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {viewMode === "input" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：文本输入区 */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="请输入要朗读的文字..."
                  className="min-h-[280px] text-base leading-relaxed"
                />
                
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    size="sm"
                  >
                    清空
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={mode === "full" ? "default" : "outline"}
                      onClick={() => setMode("full")}
                      size="sm"
                    >
                      全文模式
                    </Button>
                    <Button
                      variant={mode === "segment" ? "default" : "outline"}
                      onClick={() => setMode("segment")}
                      size="sm"
                    >
                      分段模式
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="default"
                  onClick={handleStartReading}
                  disabled={!text.trim()}
                  className="px-8 py-6 text-lg"
                >
                  开始朗读
                </Button>
              </div>
            </div>

            {/* 右侧：设置面板 */}
            <div className="space-y-6">
              <div className="p-5 border rounded-lg bg-card shadow-sm">
                <h3 className="text-lg font-medium mb-4">朗读设置</h3>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-full">
                        <SelectValue>{getSelectedVoiceDisplayName()}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.displayName} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="speed-slider">语速</Label>
                      <span className="text-sm font-medium text-primary">{speed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      id="speed-slider"
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={[speed]}
                      onValueChange={handleSpeedChange}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>慢</span>
                      <span>正常</span>
                      <span>快</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="pitch-slider">音调</Label>
                      <span className="text-sm font-medium text-primary">{pitch.toFixed(1)}</span>
                    </div>
                    <Slider
                      id="pitch-slider"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[pitch]}
                      onValueChange={handlePitchChange}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>低</span>
                      <span>正常</span>
                      <span>高</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <Button
                variant="outline"
                onClick={handleBackToInput}
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </div>

            {mode === "full" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：原文和控制区 */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">原文</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHideFullText(!hideFullText)}
                      >
                        {hideFullText ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className={`p-4 border rounded-lg ${hideFullText ? 'bg-muted/50' : ''}`}>
                      {hideFullText ? (
                        <div className="flex items-center justify-center h-32">
                          <span className="text-muted-foreground">原文已隐藏</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="default"
                        size="icon"
                        onClick={isPlaying ? handleStopReading : () => speak(text)}
                        className="h-14 w-14"
                      >
                        {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 右侧：设置面板 */}
                <div className="space-y-6">
                  <div className="p-5 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-lg font-medium mb-4">朗读设置</h3>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger className="w-full">
                            <SelectValue>{getSelectedVoiceDisplayName()}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {voices.map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.displayName} ({voice.lang})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="speed-slider-reading">语速</Label>
                          <span className="text-sm font-medium text-primary">{speed.toFixed(1)}x</span>
                        </div>
                        <Slider
                          id="speed-slider-reading"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[speed]}
                          onValueChange={handleSpeedChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>慢</span>
                          <span>正常</span>
                          <span>快</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="pitch-slider-reading">音调</Label>
                          <span className="text-sm font-medium text-primary">{pitch.toFixed(1)}</span>
                        </div>
                        <Slider
                          id="pitch-slider-reading"
                          min={0}
                          max={2}
                          step={0.1}
                          value={[pitch]}
                          onValueChange={handlePitchChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>低</span>
                          <span>正常</span>
                          <span>高</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：句子列表和控制区 */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">
                        句子列表 ({currentSegment + 1}/{segments.length})
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleAllSegments}
                        >
                          {hideAllSegments ? "显示全部" : "隐藏全部"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 pr-2">
                      {segments.map((segment, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 border rounded-lg cursor-pointer transition-all",
                            index === currentSegment 
                              ? 'bg-primary/10 border-primary shadow-sm' 
                              : 'border-border hover:bg-muted/50'
                          )}
                          onClick={() => {
                            handleStopReading()
                            setCurrentSegment(index)
                            setTimeout(() => {
                              speak(segment)
                            }, 100)
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className={`flex-1 ${!shouldShowSegment(index) ? 'hidden' : ''}`}>
                              {segment}
                            </div>
                            {!shouldShowSegment(index) && (
                              <div className="flex-1 flex items-center justify-center h-7">
                                <span className="text-muted-foreground">原文已隐藏</span>
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSegment(index)
                              }}
                              className="h-8 w-8 ml-2 flex-shrink-0"
                            >
                              {shouldShowSegment(index) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="default"
                        size="icon"
                        onClick={isPlaying ? handleStopReading : () => speak(segments[currentSegment] || segments[0])}
                        className="h-14 w-14"
                        disabled={segments.length === 0}
                      >
                        {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={handlePlayNext}
                        disabled={currentSegment >= segments.length - 1}
                        className="px-6 gap-2"
                      >
                        <SkipForward className="h-4 w-4" />
                        下一条
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 右侧：设置面板 */}
                <div className="space-y-6">
                  <div className="p-5 border rounded-lg bg-card shadow-sm">
                    <h3 className="text-lg font-medium mb-4">朗读设置</h3>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                          <SelectTrigger className="w-full">
                            <SelectValue>{getSelectedVoiceDisplayName()}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {voices.map((voice) => (
                              <SelectItem key={voice.name} value={voice.name}>
                                {voice.displayName} ({voice.lang})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="speed-slider-segment">语速</Label>
                          <span className="text-sm font-medium text-primary">{speed.toFixed(1)}x</span>
                        </div>
                        <Slider
                          id="speed-slider-segment"
                          min={0.5}
                          max={2}
                          step={0.1}
                          value={[speed]}
                          onValueChange={handleSpeedChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>慢</span>
                          <span>正常</span>
                          <span>快</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="pitch-slider-segment">音调</Label>
                          <span className="text-sm font-medium text-primary">{pitch.toFixed(1)}</span>
                        </div>
                        <Slider
                          id="pitch-slider-segment"
                          min={0}
                          max={2}
                          step={0.1}
                          value={[pitch]}
                          onValueChange={handlePitchChange}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>低</span>
                          <span>正常</span>
                          <span>高</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
