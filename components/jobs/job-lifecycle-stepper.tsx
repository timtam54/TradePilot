'use client';

import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JobStatus } from '@/lib/types';

interface Step {
  status: JobStatus;
  label: string;
}

const steps: Step[] = [
  { status: 'quote', label: 'Quote' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'in_progress', label: 'Active' },
  { status: 'completed', label: 'Done' },
];

// Map all statuses to their position in the lifecycle
const statusToStep: Record<JobStatus, number> = {
  quote: 0,
  scheduled: 1,
  in_progress: 2,
  completed: 3,
  invoiced: 3, // After done
  paid: 3, // After done
};

interface JobLifecycleStepperProps {
  status: JobStatus;
  onStatusChange?: (status: JobStatus) => void;
}

export function JobLifecycleStepper({ status, onStatusChange }: JobLifecycleStepperProps) {
  const currentStep = statusToStep[status];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isPast = index <= currentStep;

          return (
            <div key={step.status} className="flex items-center flex-1">
              <button
                onClick={() => onStatusChange?.(step.status)}
                disabled={!onStatusChange}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  onStatusChange && 'cursor-pointer hover:opacity-80',
                  !onStatusChange && 'cursor-default'
                )}
              >
                <div
                  className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isPast && 'border-muted-foreground/30 text-muted-foreground/50'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPast ? 'text-foreground' : 'text-muted-foreground/50'
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all',
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show additional status badges for invoiced/paid */}
      {(status === 'invoiced' || status === 'paid') && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium',
              status === 'invoiced' && 'bg-purple-100 text-purple-700',
              status === 'paid' && 'bg-green-100 text-green-700'
            )}
          >
            {status === 'invoiced' ? 'Invoiced' : 'Paid'}
          </div>
        </div>
      )}
    </div>
  );
}
