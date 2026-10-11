import React, { useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface HorizontalStepperProps {
  steps: string[];
  currentIndex: number;
  completedIndices: number[];
  onSelectStep: (index: number) => void;
}

export const HorizontalStepper: React.FC<HorizontalStepperProps> = ({
  steps,
  currentIndex,
  completedIndices,
  onSelectStep
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null);

  // Auto-scroll stepper into view on mobile/tablet when active step changes
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = activeItemRef.current;
      const elementLeft = element.offsetLeft;
      const elementWidth = element.offsetWidth;
      const containerWidth = container.offsetWidth;

      container.scrollTo({
        left: elementLeft - containerWidth / 2 + elementWidth / 2,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[73px] z-20 shadow-2xs">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto no-scrollbar py-3 scroll-smooth"
        >
          <nav aria-label="Audit Progress Stepper" className="min-w-[860px]">
            <ol className="flex items-center justify-between relative">
              {steps.map((step, index) => {
                const isActive = index === currentIndex;
                const isCompleted = completedIndices.includes(index) || index < currentIndex;
                const isClickable = isCompleted || index <= currentIndex;

                return (
                  <li
                    key={step}
                    ref={isActive ? activeItemRef : null}
                    className={`relative flex flex-col items-center flex-1 ${
                      index !== steps.length - 1 ? 'pr-2' : ''
                    }`}
                  >
                    {/* Connecting line between circles */}
                    {index !== steps.length - 1 && (
                      <div
                        className="absolute top-3.5 left-1/2 w-full h-[2px] bg-gray-200 -z-0"
                        aria-hidden="true"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCompleted && index < currentIndex ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                          style={{ width: '100%' }}
                        />
                      </div>
                    )}

                    {/* Step button circle */}
                    <button
                      onClick={() => {
                        if (isClickable) {
                          onSelectStep(index);
                        }
                      }}
                      disabled={!isClickable}
                      aria-current={isActive ? 'step' : undefined}
                      className={`relative z-10 flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white border-2 border-indigo-600 text-indigo-700 shadow-sm ring-3 ring-indigo-50 font-bold scale-105'
                          : isCompleted
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                          : 'bg-white border border-gray-300 text-gray-400 hover:text-gray-600 cursor-not-allowed'
                      }`}
                      title={`${index + 1}. ${step} ${isCompleted ? '(Completed)' : isActive ? '(Active)' : ''}`}
                    >
                      {isCompleted && !isActive ? (
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <span className="font-mono">{index + 1}</span>
                      )}
                    </button>

                    {/* Step text label */}
                    <button
                      onClick={() => {
                        if (isClickable) {
                          onSelectStep(index);
                        }
                      }}
                      disabled={!isClickable}
                      className={`mt-1.5 text-xs font-medium tracking-tight text-center whitespace-nowrap transition-colors ${
                        isActive
                          ? 'text-indigo-700 font-bold'
                          : isCompleted
                          ? 'text-gray-800 hover:text-indigo-600'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {step}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
};
