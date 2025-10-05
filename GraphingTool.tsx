import { useState, useEffect, useRef, SetStateAction } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';
import { cn } from '@/lib/utils';

interface GraphingToolProps {
  className?: string;
}

// 模拟函数解析和计算（实际应用中应使用专业的数学表达式解析库）
const evaluateFunction = (expression: string, x: number): number => {
  try {
    // 简单替换常见的数学函数以便于eval解析
    const sanitizedExpr = expression
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/^y=/, '') // 移除开头的y=
      .replace(/x/g, `(${x})`); // 替换x为当前值
    
    // 使用eval计算表达式（注意：在实际应用中应使用更安全的方式）
    return eval(sanitizedExpr);
  } catch (error) {
    return NaN;
  }
};

// 生成函数图像数据
const generateFunctionData = (
  expression: string, 
  start: number = -10, 
  end: number = 10, 
  steps: number = 100
): { x: number; y: number }[] => {
  const data = [];
  const stepSize = (end - start) / steps;
  
  for (let i = 0; i <= steps; i++) {
    const x = start + i * stepSize;
    const y = evaluateFunction(expression, x);
    
    // 过滤掉无效值和极端值
    if (!isNaN(y) && Math.abs(y) < 1000) {
      data.push({ x, y });
    }
  }
  
  return data;
};

export default function GraphingTool({ className }: GraphingToolProps) {
  const [expression, setExpression] = useState('y=x');
  const [data, setData] = useState<{ x: number; y: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  
  // 生成图像
  const generateGraph = () => {
    setError(null);
    
    try {
      const newData = generateFunctionData(expression);
      setData(newData);
    } catch (err) {
      setError('无法解析函数表达式，请检查输入格式');
    }
  };

  // 当表达式变化时重新生成图像
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateGraph();
    }, 500); // 延迟生成，避免输入过程中频繁计算
    
    return () => clearTimeout(timeoutId);
  }, [expression, zoom]);

  // 处理表达式变化
  const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(e.target.value);
  };

  // 处理点拖动（简化版）
  const handleDotDrag = (index: number, newY: number) => {
    if (draggingPoint === index) {
      const newData = [...data];
      newData[index].y = newY;
      setData(newData);
      
      // 在实际应用中，这里应该根据拖动的点来调整函数表达式
      // 这需要复杂的曲线拟合算法，这里仅做演示
    }
  };

  return (
    <div className={cn('w-full max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl overflow-hidden', className)}>
      <div className="p-4 bg-gray-900">
        <h3 className="text-white text-xl font-semibold text-center">函数图像绘制</h3>
      </div>
      
      {/* 函数输入 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={expression}
            onChange={handleExpressionChange}
            placeholder="输入函数表达式，例如 y=x² 或 y=sin(x)"
            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={generateGraph}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
          >
            绘制
          </button>
        </div>
        
        {/* 缩放控制 */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-gray-400 text-sm">缩放:</div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-48 accent-blue-500"
          />
        </div>
        
        {error && (
          <div className="mt-2 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>
      
      {/* 图像绘制区域 */}
      <div className="p-4 h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="x" 
              stroke="#9CA3AF" 
              domain={[-10/zoom, 10/zoom]}
              label={{ value: 'x', position: 'bottom', offset: 0, fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              domain={[-10/zoom, 10/zoom]}
              label={{ value: 'y', angle: -90, position: 'left', offset: 0, fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
              formatter={(value: string | number | (string | number)[], name?: string, props?: any) => {
                if (typeof value === 'number') {
                  return value.toFixed(4);
                }
                if (Array.isArray(value)) {
                  return value.map(v => typeof v === 'number' ? v.toFixed(4) : v).join(', ');
                }
                return value;
              }}
            />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#3B82F6" 
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, index } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    stroke="#1E40AF"
                    strokeWidth={2}
                    fill="#3B82F6"
                    onMouseDown={(e) => setDraggingPoint(index)}
                    onMouseUp={() => setDraggingPoint(null)}
                    onMouseLeave={() => setDraggingPoint(null)}
                    onMouseMove={(e) => {
                      if (draggingPoint === index && e.clientY) {
                        const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
                        const y = ((rect.top + rect.height / 2 - e.clientY) / rect.height) * 20 / zoom;
                        if (index !== null) {
                          handleDotDrag(index, y);
                        }
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* 使用说明 */}
      <div className="p-4 bg-gray-900 text-xs text-gray-400">
        <p className="mb-2">支持的函数：sin, cos, tan, sqrt, x², x³等</p>
        <p>示例：y=x², y=sin(x), y=sqrt(x), y=x*sin(x)</p>
      </div>
    </div>
  );
}