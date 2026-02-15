'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

type PeriodType = 'monthly' | 'quarterly' | 'yearly';

interface PeriodSelectorProps {
  onPeriodChange?: (start: Date, end: Date, type: PeriodType) => void;
  defaultType?: PeriodType;
}

export function PeriodSelector({ onPeriodChange, defaultType = 'monthly' }: PeriodSelectorProps) {
  const today = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>(defaultType);
  const [baseDate, setBaseDate] = useState(today);

  const { startDate, endDate, displayLabel } = useMemo(() => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const date = baseDate.getDate();

    if (periodType === 'monthly') {
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0),
        displayLabel: new Date(year, month).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
      };
    }

    if (periodType === 'quarterly') {
      const quarter = Math.floor(month / 3);
      return {
        startDate: new Date(year, quarter * 3, 1),
        endDate: new Date(year, quarter * 3 + 3, 0),
        displayLabel: `Q${quarter + 1} ${year}`,
      };
    }

    // yearly
    return {
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31),
      displayLabel: year.toString(),
    };
  }, [baseDate, periodType]);

  const handlePrevious = () => {
    const newDate = new Date(baseDate);
    if (periodType === 'monthly') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (periodType === 'quarterly') {
      newDate.setMonth(newDate.getMonth() - 3);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setBaseDate(newDate);
    onPeriodChange?.(newDate, new Date(), periodType);
  };

  const handleNext = () => {
    const newDate = new Date(baseDate);
    if (periodType === 'monthly') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (periodType === 'quarterly') {
      newDate.setMonth(newDate.getMonth() + 3);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setBaseDate(newDate);
    onPeriodChange?.(newDate, new Date(), periodType);
  };

  const handleToday = () => {
    setBaseDate(today);
    onPeriodChange?.(today, today, periodType);
  };

  const handlePeriodChange = (type: PeriodType) => {
    setPeriodType(type);
    setBaseDate(today);
    onPeriodChange?.(today, today, type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Période d'Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Type Buttons */}
        <div className="flex gap-2">
          {(['monthly', 'quarterly', 'yearly'] as const).map((type) => (
            <Button
              key={type}
              variant={periodType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(type)}
              className="flex-1"
            >
              {type === 'monthly' && 'Mensuel'}
              {type === 'quarterly' && 'Trimestriel'}
              {type === 'yearly' && 'Annuel'}
            </Button>
          ))}
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">Période sélectionnée</p>
            <p className="text-lg font-bold text-gray-900 capitalize">{displayLabel}</p>
            <p className="text-xs text-gray-500 mt-1">
              {startDate.toLocaleDateString('fr-FR')} - {endDate.toLocaleDateString('fr-FR')}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="gap-1"
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="flex-1 text-blue-600 hover:bg-blue-50"
          >
            Aujourd'hui
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
