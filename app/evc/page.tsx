"use client"

import React, { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Fraction {
  numerator: number
  denominator: number
}

interface DistributionItem {
  x: string
  p: string
  id: string
}

function parseFraction(value: string): Fraction {
  value = value.trim()
  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(s => parseFloat(s.trim()))
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      return { numerator: 0, denominator: 1 }
    }
    return { numerator, denominator }
  }
  const num = parseFloat(value)
  return isNaN(num) ? { numerator: 0, denominator: 1 } : { numerator: num, denominator: 1 }
}

function fractionToDecimal(fraction: Fraction): number {
  return fraction.numerator / fraction.denominator
}

function addFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator + b.numerator * a.denominator
  const denominator = a.denominator * b.denominator
  return simplifyFraction(numerator, denominator)
}

function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.denominator - b.numerator * a.denominator
  const denominator = a.denominator * b.denominator
  return simplifyFraction(numerator, denominator)
}

function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  const numerator = a.numerator * b.numerator
  const denominator = a.denominator * b.denominator
  return simplifyFraction(numerator, denominator)
}

function squareFraction(fraction: Fraction): Fraction {
  const numerator = fraction.numerator * fraction.numerator
  const denominator = fraction.denominator * fraction.denominator
  return simplifyFraction(numerator, denominator)
}

function simplifyFraction(numerator: number, denominator: number): Fraction {
  if (denominator < 0) {
    numerator = -numerator
    denominator = -denominator
  }
  
  const gcd = (a: number, b: number): number => {
    a = Math.abs(a)
    b = Math.abs(b)
    while (b !== 0) {
      const temp = b
      b = a % b
      a = temp
    }
    return a
  }
  
  const divisor = gcd(numerator, denominator)
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  }
}

function fractionToString(fraction: Fraction): string {
  if (fraction.denominator === 1) {
    return fraction.numerator.toString()
  }
  return `${fraction.numerator}/${fraction.denominator}`
}

function isFractionValid(fraction: Fraction): boolean {
  return fraction.denominator !== 0 && !isNaN(fraction.numerator) && !isNaN(fraction.denominator)
}

function shouldShowAsDecimal(fraction: Fraction): boolean {
  const decimal = fractionToDecimal(fraction)
  const rounded = Math.round(decimal * 100) / 100
  return Math.abs(decimal - rounded) < 0.0001
}

function getDisplayValue(fraction: Fraction): string {
  if (shouldShowAsDecimal(fraction)) {
    const decimal = fractionToDecimal(fraction)
    return decimal % 1 === 0 ? decimal.toString() : decimal.toFixed(2)
  }
  return fractionToString(fraction)
}

export default function ExpectedValueCalculator() {
  const [distribution, setDistribution] = useState<DistributionItem[]>([
    { x: "", p: "", id: Date.now().toString() + "-1" },
    { x: "", p: "", id: Date.now().toString() + "-2" },
  ])
  const [error, setError] = useState<string | null>(null)

  const { expectedValue, variance, isValid } = useMemo(() => {
    const hasInput = distribution.some(item => item.x.trim() !== "" || item.p.trim() !== "")
    if (!hasInput) {
      setError(null)
      return { expectedValue: { numerator: 0, denominator: 1 }, variance: { numerator: 0, denominator: 1 }, isValid: false }
    }

    const parsedDistribution = distribution.map(item => ({
      x: parseFraction(item.x),
      p: parseFraction(item.p)
    }))

    const isValidDistribution = parsedDistribution.every(item => 
      isFractionValid(item.x) && isFractionValid(item.p)
    )

    if (!isValidDistribution) {
      setError("请输入有效的数值或分数")
      return { expectedValue: { numerator: 0, denominator: 1 }, variance: { numerator: 0, denominator: 1 }, isValid: false }
    }

    const sumP = parsedDistribution.reduce((sum, item) => 
      addFractions(sum, item.p), { numerator: 0, denominator: 1 }
    )

    const sumPDecimal = fractionToDecimal(sumP)
    if (Math.abs(sumPDecimal - 1) > 0.0001) {
      setError("所有概率之和必须为1")
      return { expectedValue: { numerator: 0, denominator: 1 }, variance: { numerator: 0, denominator: 1 }, isValid: false }
    }

    const hasNegativeP = parsedDistribution.some(item => fractionToDecimal(item.p) < 0)
    if (hasNegativeP) {
      setError("概率不能为负数")
      return { expectedValue: { numerator: 0, denominator: 1 }, variance: { numerator: 0, denominator: 1 }, isValid: false }
    }

    setError(null)

    const expectedValue = parsedDistribution.reduce((sum, item) => 
      addFractions(sum, multiplyFractions(item.x, item.p)), { numerator: 0, denominator: 1 }
    )

    const variance = parsedDistribution.reduce((sum, item) => {
      const diff = subtractFractions(item.x, expectedValue)
      const squaredDiff = squareFraction(diff)
      return addFractions(sum, multiplyFractions(squaredDiff, item.p))
    }, { numerator: 0, denominator: 1 })

    return { expectedValue, variance, isValid: true }
  }, [distribution])

  const handleAddRow = () => {
    const newId = Date.now().toString() + "-" + distribution.length
    setDistribution([...distribution, { x: "", p: "", id: newId }])
  }

  const handleRemoveRow = (id: string) => {
    if (distribution.length > 2) {
      setDistribution(distribution.filter(item => item.id !== id))
    } else {
      setError("至少需要两行分布列")
    }
  }

  const handleUpdateValue = (id: string, field: "x" | "p", value: string) => {
    setDistribution(distribution.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-b from-primary/5 to-transparent px-4 py-6 sm:py-12">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2 sm:mb-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">数学期望与方差计算器</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">输入分布列，计算数学期望与方差</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>错误</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-sm">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">分布列输入</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 sm:pt-6">
            <div className="space-y-3 sm:space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-medium text-muted-foreground text-xs sm:text-sm">X (取值)</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-left font-medium text-muted-foreground text-xs sm:text-sm">P (概率)</th>
                      <th className="py-2 sm:py-3 px-2 sm:px-4 text-right font-medium text-muted-foreground text-xs sm:text-sm">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distribution.map((item, index) => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="grid gap-1 sm:gap-2">
                            <Label htmlFor={`x-${index}`} className="text-xs sm:text-sm">X{index + 1}</Label>
                            <Input
                              id={`x-${index}`}
                              placeholder="1 或 1/5"
                              value={item.x}
                              onChange={(e) => handleUpdateValue(item.id, "x", e.target.value)}
                              className="h-9 sm:h-11 text-sm"
                            />
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4">
                          <div className="grid gap-1 sm:gap-2">
                            <Label htmlFor={`p-${index}`} className="text-xs sm:text-sm">P{index + 1}</Label>
                            <Input
                              id={`p-${index}`}
                              placeholder="0.5 或 1/2"
                              value={item.p}
                              onChange={(e) => handleUpdateValue(item.id, "p", e.target.value)}
                              className="h-9 sm:h-11 text-sm"
                            />
                          </div>
                        </td>
                        <td className="py-2 sm:py-3 px-2 sm:px-4 text-right">
                          {index >= 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRow(item.id)}
                              className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-destructive/10 hover:text-destructive"
                            >
                              ✕
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleAddRow}
                  className="gap-2 text-sm h-9 sm:h-11 px-4"
                >
                  + 添加一行
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">数学期望 E(X)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
                {isValid ? getDisplayValue(expectedValue) : "Null"}
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isValid && !shouldShowAsDecimal(expectedValue) && (
                    <span>小数值: {fractionToDecimal(expectedValue).toFixed(6)}</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">方差 D(X)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-4">
                {isValid ? getDisplayValue(variance) : "Null"}
              </div>
              <div className="space-y-1 sm:space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isValid && !shouldShowAsDecimal(variance) && (
                    <span>小数值: {fractionToDecimal(variance).toFixed(6)}</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
