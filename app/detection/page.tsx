"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Monitor, Smartphone, Tablet, Laptop } from "lucide-react"

interface DeviceInfo {
  screenWidth: number
  screenHeight: number
  viewportWidth: number
  viewportHeight: number
  devicePixelRatio: number
  userAgent: string
  orientation: string
  deviceType: string
  breakpoint: string
}

export default function DeviceDetectionPage() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [mounted, setMounted] = useState(false)

  const getDeviceType = (width: number) => {
    if (width < 768) return "mobile"
    if (width < 1024) return "tablet"
    if (width < 1440) return "laptop"
    return "desktop"
  }

  const getBreakpoint = (width: number) => {
    if (width < 640) return "xs (< 640px)"
    if (width < 768) return "sm (640px - 767px)"
    if (width < 1024) return "md (768px - 1023px)"
    if (width < 1280) return "lg (1024px - 1279px)"
    if (width < 1536) return "xl (1280px - 1535px)"
    return "2xl (≥ 1536px)"
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />
      case "tablet":
        return <Tablet className="h-5 w-5" />
      case "laptop":
        return <Laptop className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  const updateDeviceInfo = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const devicePixelRatio = window.devicePixelRatio || 1
    const userAgent = navigator.userAgent
    const orientation = window.screen.orientation?.type || 
      (viewportWidth > viewportHeight ? "landscape" : "portrait")
    const deviceType = getDeviceType(viewportWidth)
    const breakpoint = getBreakpoint(viewportWidth)

    setDeviceInfo({
      screenWidth,
      screenHeight,
      viewportWidth,
      viewportHeight,
      devicePixelRatio,
      userAgent,
      orientation,
      deviceType,
      breakpoint,
    })
  }

  useEffect(() => {
    setMounted(true)
    updateDeviceInfo()

    const handleResize = () => {
      updateDeviceInfo()
    }

    const handleOrientationChange = () => {
      // 延迟一点以确保尺寸更新
      setTimeout(updateDeviceInfo, 100)
    }

    window.addEventListener("resize", handleResize)
    window.addEventListener("orientationchange", handleOrientationChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
    }
  }, [])

  if (!mounted || !deviceInfo) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-foreground">设备检测器</h1>
              </div>
              <p className="text-muted-foreground">检测当前设备的屏幕尺寸、类型和响应式断点</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mb-4"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-foreground">设备检测器</h1>
            </div>
            <p className="text-muted-foreground">检测当前设备的屏幕尺寸、类型和响应式断点</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* 设备类型卡片 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getDeviceIcon(deviceInfo.deviceType)}
              设备类型
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {deviceInfo.deviceType.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {deviceInfo.breakpoint}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              方向: <span className="font-medium">{deviceInfo.orientation}</span>
            </div>
          </CardContent>
        </Card>

        {/* 尺寸信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 视口尺寸 */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>视口尺寸 (Viewport)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">宽度:</span>
                  <span className="font-mono font-bold text-green-600">
                    {deviceInfo.viewportWidth}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">高度:</span>
                  <span className="font-mono font-bold text-green-600">
                    {deviceInfo.viewportHeight}px
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">比例:</span>
                  <span className="font-mono">
                    {(deviceInfo.viewportWidth / deviceInfo.viewportHeight).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 屏幕尺寸 */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>屏幕分辨率 (Screen)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">宽度:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {deviceInfo.screenWidth}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">高度:</span>
                  <span className="font-mono font-bold text-blue-600">
                    {deviceInfo.screenHeight}px
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">像素比:</span>
                  <span className="font-mono">
                    {deviceInfo.devicePixelRatio}x
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tailwind CSS 断点参考 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tailwind CSS 响应式断点</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: "xs", range: "< 640px", active: deviceInfo.viewportWidth < 640 },
                { name: "sm", range: "640px+", active: deviceInfo.viewportWidth >= 640 && deviceInfo.viewportWidth < 768 },
                { name: "md", range: "768px+", active: deviceInfo.viewportWidth >= 768 && deviceInfo.viewportWidth < 1024 },
                { name: "lg", range: "1024px+", active: deviceInfo.viewportWidth >= 1024 && deviceInfo.viewportWidth < 1280 },
                { name: "xl", range: "1280px+", active: deviceInfo.viewportWidth >= 1280 && deviceInfo.viewportWidth < 1536 },
                { name: "2xl", range: "1536px+", active: deviceInfo.viewportWidth >= 1536 },
              ].map((breakpoint) => (
                <div
                  key={breakpoint.name}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    breakpoint.active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="font-bold">{breakpoint.name}</div>
                  <div className="text-xs opacity-80">{breakpoint.range}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 用户代理信息 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>浏览器信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">User Agent:</span>
              </div>
              <div className="font-mono text-xs bg-muted/50 p-3 rounded-lg break-all">
                {deviceInfo.userAgent}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}