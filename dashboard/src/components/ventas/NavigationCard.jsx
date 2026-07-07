import React from 'react'
import { ChevronRight } from 'lucide-react'

const NavigationCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = 'indigo',
  metric = null,
  metricLabel = null 
}) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-100',
      iconBg: 'bg-indigo-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      hoverBg: 'hover:bg-green-100',
      iconBg: 'bg-green-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      hoverBg: 'hover:bg-amber-100',
      iconBg: 'bg-amber-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      hoverBg: 'hover:bg-red-100',
      iconBg: 'bg-red-100'
    }
  }

  const colors = colorClasses[color] || colorClasses.indigo

  return (
    <a 
      href={href}
      className={`${colors.bg} ${colors.border} border rounded-lg p-6 transition-all duration-200 ${colors.hoverBg} hover:shadow-md group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 ${colors.iconBg} rounded-lg`}>
          {Icon && <Icon className={`w-6 h-6 ${colors.text}`} />}
        </div>
        <ChevronRight className={`w-5 h-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
      
      <div className="space-y-2">
        <h3 className={`font-bold text-lg ${colors.text}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
        
        {metric !== null && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${colors.text} tabular-nums`}>
                {metric}
              </span>
              {metricLabel && (
                <span className="text-sm text-gray-500">
                  {metricLabel}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </a>
  )
}

export default NavigationCard
