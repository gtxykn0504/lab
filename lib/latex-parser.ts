export interface ParsedEquation {
  type: "explicit" | "implicit"; // 显式 y=f(x) 或隐式 f(x,y)=g(x,y)
  expression: string; // 转换后的 JS 表达式
  leftSide?: string; // 隐式方程左侧
  rightSide?: string; // 隐式方程右侧
}

// 将 LaTeX 转换为可计算的 JavaScript 表达式
export function parseLatex(latex: string): ParsedEquation {
  // 清理输入
  let expr = latex.trim();
  
  // 检查是否是隐式方程（包含 = 且两边都有变量）
  if (expr.includes("=")) {
    const parts = expr.split("=");
    if (parts.length === 2) {
      const left = convertLatexToJs(parts[0].trim());
      const right = convertLatexToJs(parts[1].trim());
      
      // 检查是否包含 y
      const hasY = /\by\b/.test(left) || /\by\b/.test(right);
      
      if (hasY) {
        return {
          type: "implicit",
          expression: `(${left}) - (${right})`,
          leftSide: left,
          rightSide: right,
        };
      }
    }
  }
  
  // 显式方程 y = f(x) 或直接是 f(x)
  let cleanExpr = expr;
  if (cleanExpr.toLowerCase().startsWith("y=") || cleanExpr.toLowerCase().startsWith("y =")) {
    cleanExpr = cleanExpr.replace(/^y\s*=\s*/i, "");
  }
  
  return {
    type: "explicit",
    expression: convertLatexToJs(cleanExpr),
  };
}

// 将 LaTeX 语法转换为 JavaScript 表达式
function convertLatexToJs(latex: string): string {
  let result = latex;
  
  // 移除 LaTeX 的美元符号和空格
  result = result.replace(/\$/g, "").trim();
  
  // 处理 \left 和 \right（括号修饰符）
  result = result.replace(/\\left\s*/g, "");
  result = result.replace(/\\right\s*/g, "");
  
  // 处理分数 \frac{a}{b} -> ((a)/(b))
  // 使用更智能的括号匹配来处理嵌套分数
  result = parseFractions(result);
  
  // 处理平方根 \sqrt{a} -> Math.sqrt(a)
  result = result.replace(/\\sqrt\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, "Math.sqrt($1)");
  
  // 处理 n 次方根 \sqrt[n]{a} -> Math.pow(a, 1/n)
  result = result.replace(/\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, 
    "Math.pow($2, 1/($1))");
  
  // 处理上标/幂 a^{b} -> a**(b)
  // 首先处理带花括号的情况（递归处理嵌套）
  let prevPow = "";
  while (prevPow !== result) {
    prevPow = result;
    result = result.replace(/\^\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, "**($1)");
  }
  // 然后处理简单的情况 a^2 -> a**2
  result = result.replace(/\^(\d+)/g, "**$1");
  result = result.replace(/\^([a-zA-Z])/g, "**$1");
  
  // 处理三角函数
  result = result.replace(/\\sin\s*/g, "Math.sin");
  result = result.replace(/\\cos\s*/g, "Math.cos");
  result = result.replace(/\\tan\s*/g, "Math.tan");
  result = result.replace(/\\arcsin\s*/g, "Math.asin");
  result = result.replace(/\\arccos\s*/g, "Math.acos");
  result = result.replace(/\\arctan\s*/g, "Math.atan");
  result = result.replace(/\\sinh\s*/g, "Math.sinh");
  result = result.replace(/\\cosh\s*/g, "Math.cosh");
  result = result.replace(/\\tanh\s*/g, "Math.tanh");
  
  // 处理对数
  result = result.replace(/\\ln\s*/g, "Math.log");
  result = result.replace(/\\log\s*/g, "Math.log10");
  result = result.replace(/\\lg\s*/g, "Math.log10");
  
  // 处理绝对值 |a| 或 \abs{a}
  result = result.replace(/\\abs\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, "Math.abs($1)");
  result = result.replace(/\|([^|]+)\|/g, "Math.abs($1)");
  
  // 处理指数函数
  result = result.replace(/\\exp\s*/g, "Math.exp");
  
  // 处理常量
  result = result.replace(/\\pi/g, "Math.PI");
  result = result.replace(/\\e\b/g, "Math.E");
  
  // 处理乘法符号
  result = result.replace(/\\cdot/g, "*");
  result = result.replace(/\\times/g, "*");
  
  // 处理除法符号
  result = result.replace(/\\div/g, "/");
  
  // 移除剩余的 LaTeX 命令中的反斜杠
  result = result.replace(/\\/g, "");
  
  // 处理隐式乘法：数字后跟变量，或变量后跟括号
  // 2x -> 2*x, x(2) -> x*(2), (2)(3) -> (2)*(3)
  result = result.replace(/(\d)([xy])/g, "$1*$2");
  result = result.replace(/([xy])(\()/g, "$1*$2");
  result = result.replace(/(\))(\()/g, "$1*$2");
  result = result.replace(/(\d)(\()/g, "$1*$2");
  result = result.replace(/(\))([xy\d])/g, "$1*$2");
  
  // 清理多余的空格
  result = result.replace(/\s+/g, "");
  
  return result;
}

// 计算显式函数 y = f(x)
export function evaluateExplicit(expression: string, x: number): number {
  try {
    let expr = expression.replace(/\bx\b/g, `(${x})`);
    const fn = new Function(`return ${expr}`);
    return fn();
  } catch {
    return NaN;
  }
}

// 计算隐式方程 f(x,y) = 0 的值
export function evaluateImplicit(expression: string, x: number, y: number): number {
  try {
    let expr = expression
      .replace(/\bx\b/g, `(${x})`)
      .replace(/\by\b/g, `(${y})`);
    const fn = new Function(`return ${expr}`);
    return fn();
  } catch {
    return NaN;
  }
}

// 检查点 (x, y) 是否在隐式曲线上（使用容差）
export function isOnImplicitCurve(
  expression: string,
  x: number,
  y: number,
  tolerance: number = 0.1
): boolean {
  const value = evaluateImplicit(expression, x, y);
  return Math.abs(value) < tolerance;
}

// 使用 Marching Squares 算法检测隐式曲线是否穿过网格单元
export function checkGridCell(
  expression: string,
  x: number,
  y: number,
  cellSize: number
): boolean {
  // 检查四个角的符号
  const v00 = evaluateImplicit(expression, x, y);
  const v10 = evaluateImplicit(expression, x + cellSize, y);
  const v01 = evaluateImplicit(expression, x, y + cellSize);
  const v11 = evaluateImplicit(expression, x + cellSize, y + cellSize);
  
  // 如果四个角的值都是有效的，且符号不全相同，则曲线穿过此单元
  if ([v00, v10, v01, v11].every(v => isFinite(v))) {
    const signs = [Math.sign(v00), Math.sign(v10), Math.sign(v01), Math.sign(v11)];
    const hasPositive = signs.some(s => s > 0);
    const hasNegative = signs.some(s => s < 0);
    return hasPositive && hasNegative;
  }
  
  return false;
}

// 智能解析分数，支持深度嵌套
function parseFractions(latex: string): string {
  let result = latex;
  
  // 查找 \frac 并提取其参数（支持嵌套括号）
  while (result.includes("\\frac")) {
    const fracIndex = result.indexOf("\\frac");
    
    // 找到 \frac 后的第一个 {
    let i = fracIndex + 5;
    while (i < result.length && result[i] !== "{") i++;
    
    if (i >= result.length) break;
    
    // 提取分子（第一个 {} 中的内容）
    const numStart = i;
    const numEnd = findMatchingBrace(result, numStart);
    if (numEnd === -1) break;
    
    const numerator = result.slice(numStart + 1, numEnd);
    
    // 找到分母的开始 {
    i = numEnd + 1;
    while (i < result.length && result[i] !== "{") i++;
    
    if (i >= result.length) break;
    
    // 提取分母（第二个 {} 中的内容）
    const denStart = i;
    const denEnd = findMatchingBrace(result, denStart);
    if (denEnd === -1) break;
    
    const denominator = result.slice(denStart + 1, denEnd);
    
    // 替换整个 \frac{...}{...} 为 ((...)/(...)
    const replacement = `((${numerator})/(${denominator}))`;
    result = result.slice(0, fracIndex) + replacement + result.slice(denEnd + 1);
  }
  
  return result;
}

// 找到匹配的闭合括号位置
function findMatchingBrace(str: string, openIndex: number): number {
  if (str[openIndex] !== "{") return -1;
  
  let depth = 1;
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  
  return -1;
}
