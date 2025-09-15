import React from 'react';
import type { AppStep } from '../types';
import { UploadIcon, TableIcon, InsightIcon, EmailIcon } from './Icons';

interface StepIndicatorProps {
  currentStep: AppStep;
  completedSteps: Set<AppStep>;
  onStepClick: (step: AppStep) => void;
}

const steps: { id: AppStep; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <UploadIcon /> },
    { id: 'results', label: 'Review', icon: <TableIcon /> },
    { id: 'insights', label: 'Insights', icon: <InsightIcon /> },
    { id: 'email', label: 'Email', icon: <EmailIcon /> },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, completedSteps, onStepClick }) => {
  return (
    <nav className="flex items-center space-x-2 sm:space-x-4" aria-label="Analysis Steps">
      {steps.map((step) => {
        const isCompleted = completedSteps.has(step.id);
        const isActive = currentStep === step.id;

        let stateClasses = 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50';
        if (isCompleted) {
            stateClasses = 'bg-gray-600 text-gray-300 hover:bg-gray-500 cursor-pointer';
        }
        if (isActive) {
            stateClasses = 'bg-cyan-600 text-white cursor-default ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-800';
        }

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            disabled={!isCompleted}
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${stateClasses}`}
            aria-current={isActive ? 'step' : undefined}
          >
            {step.icon}
            <span className="hidden sm:inline font-medium text-sm">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default StepIndicator;
