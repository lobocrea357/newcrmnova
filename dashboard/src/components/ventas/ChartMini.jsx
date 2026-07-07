import React from 'react'

const ChartMini = ({ 
  data, 
  type = 'bar',
  height = 60,
  color = 'indigo',
  labels = true 
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  }

  const barColor = colorClasses[color] || colorClasses.indigo

  if (type === 'bar') {
    const maxValue = Math.max(...data.map(d => d.value))
    
    return (
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className={`${barColor} rounded-t transition-all duration-300 hover:opacity-80`}
              style={{ 
                height: `${(item.value / maxValue) * height}px`,
                minHeight: '4px'
              }}
              title={labels ? `${item.label}: ${item.value}` : item.value}
            />
            {labels && (
              <span className="text-xs text-gray-500 mt-1 truncate max-w-full">
                {item.label}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="relative w-12 h-12">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const rotation = index === 0 ? 0 : data.slice(0, index).reduce((sum, prev) => sum + (prev.value / total) * 360, 0)
            
            return (
              <div
                key={index}
                className={`absolute inset-0 ${barColor} rounded-full`}
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos((rotation - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((rotation + percentage * 3.6 - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((rotation + percentage * 3.6 - 90) * Math.PI / 180)}%)`
                }}
                title={labels ? `${item.label}: ${item.value} (${percentage.toFixed(1)}%)` : `${item.value} (${percentage.toFixed(1)}%)`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return <div className="text-gray-400 text-sm">Chart type not supported</div>
}

export default ChartMini
