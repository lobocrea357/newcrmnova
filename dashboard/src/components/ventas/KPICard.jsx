import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon: Icon, 
  color = 'indigo',
  size = 'medium',
  loading = false 
}) => {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      iconBg: 'bg-indigo-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      iconBg: 'bg-green-100'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      iconBg: 'bg-red-100'
    }
  }

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  }

  const valueSizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }

  const colors = colorClasses[color] || colorClasses.indigo

  const getTrendIcon = () => {
    if (trend === 'positiva') return TrendingUp
    if (trend === 'negativa') return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (trend === 'positiva') return 'text-green-600'
    if (trend === 'negativa') return 'text-red-600'
    return 'text-gray-500'
  }

  const TrendIcon = getTrendIcon()

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border rounded-lg animate-pulse`}>
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border rounded-lg transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${colors.iconBg} rounded-lg`}>
          {Icon && <Icon className={`w-5 h-5 ${colors.text}`} />}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className={`font-bold ${valueSizeClasses[size]} ${colors.text} tabular-nums`}>
          {value}
        </h3>
        <p className="text-sm text-gray-600 font-medium">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default KPICard
