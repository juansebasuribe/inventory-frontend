// src/features/dashboard/components/widgets/MetricWidget.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../../../../shared/components/ui/cards/Card';
import { cn } from '../../../../shared/utils';
import type { DashboardMetric } from '../../types';

interface MetricWidgetProps {
  metric: DashboardMetric;
  className?: string;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({
  metric,
  className
}) => {
  const getTrendIcon = () => {
    if (!metric.trend) return null;
    
    switch (metric.trend.direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!metric.trend) return 'text-gray-500';
    
    switch (metric.trend.direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getColorClasses = () => {
    switch (metric.color) {
      case 'primary':
        return 'border-l-primary-500 bg-primary-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'danger':
        return 'border-l-red-500 bg-red-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Card className={cn(
      "p-6 border-l-4 transition-all duration-200 hover:shadow-md",
      getColorClasses(),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            {metric.title}
          </h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">
              {metric.value}
            </p>
            {metric.trend && (
              <div className={cn(
                "ml-2 flex items-center text-sm font-medium",
                getTrendColor()
              )}>
                {getTrendIcon()}
                <span className="ml-1">
                  {metric.trend.value > 0 ? '+' : ''}{metric.trend.value}%
                </span>
              </div>
            )}
          </div>
          {metric.trend && (
            <p className="text-xs text-gray-500 mt-1">
              {metric.trend.label}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};