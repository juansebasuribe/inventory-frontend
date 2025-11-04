// src/features/dashboard/components/widgets/ChartWidget.tsx
import React from 'react';
import { Card } from '../../../../shared/components/ui/cards/Card';
import { cn } from '../../../../shared/utils';

interface ChartWidgetProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
  title,
  children,
  className
}) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {title}
        </h3>
      </div>
      <div className="h-64 flex items-center justify-center">
        {children}
      </div>
    </Card>
  );
};