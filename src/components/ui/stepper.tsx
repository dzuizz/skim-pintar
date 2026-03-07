'use client'

import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  currentStep: number
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isUpcoming = index > currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary-700 text-white',
                    isActive && 'bg-gold-500 text-white ring-4 ring-gold-100',
                    isUpcoming && 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    isCompleted && 'text-primary-700',
                    isActive && 'text-gold-700',
                    isUpcoming && 'text-gray-400 dark:text-gray-500',
                  )}
                >
                  {step}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 sm:mx-3',
                    index < currentStep
                      ? 'bg-primary-700'
                      : 'border-t-2 border-dashed border-gray-300 dark:border-gray-600',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { Stepper }
export type { StepperProps }
