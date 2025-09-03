import React from 'react';
import type { AppStep } from '../types';
import { UploadIcon, TableIcon, InsightIcon, EmailIcon } from './Icons';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const Step: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean }> = ({ icon, label, isActive }) => {
  const activeClasses = 'text-cyan-400 border-cyan-400';
  const inactiveClasses = 'text-gray-500 border-gray-700';
  return (
    <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 rounded-lg transition-all duration-300 ${isActive ? 'bg-gray-700/50' : ''}`}>
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isActive ? activeClasses : inactiveClasses} transition-colors duration-300`}>
        {icon}
      </div>
      <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-400'} transition-colors duration-300`}>{label}</span>
    </div>
  );
};

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps: { id: AppStep; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload & Categorize', icon: <UploadIcon /> },
    { id: 'results', label: 'Analyze & Review', icon: <TableIcon /> },
    { id: 'insights', label: 'Generate Insights', icon: <InsightIcon /> },
    { id: 'email', label: 'Draft Email', icon: <EmailIcon /> },
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row justify-between items-center bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-lg">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <Step
            icon={step.icon}
            label={step.label}
            isActive={currentStep === step.id}
          />
          {index < steps.length - 1 && (
            <div className="hidden sm:block flex-grow h-0.5 bg-gray-700 mx-4"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;