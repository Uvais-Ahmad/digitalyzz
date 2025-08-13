"use client"

import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';

const TOUR_SEEN_KEY = 'hasSeenTour';

const steps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Digitalyzz! This guided tour will show you how to upload, process, validate, and export your data using AI-enhanced features. Let\'s get started!',
    placement: 'center',
  },
  {
    target: '[data-tour="file-upload"]',
    content: 'Step 1: Start by uploading your CSV or XLSX files here. The system supports automatic AI-enhanced mapping to detect your data structure.',
  },
  {
    target: '[data-tour="data-tab"]',
    content: 'Step 2: After uploading, switch to the Data tab to view and manage your uploaded data. You can edit records, search through data, and organize it by entity type (Clients, Workers, Tasks).',
  },
  {
    target: '[data-tour="validation-tab"]',
    content: 'Step 3: Check the Validation tab to review any data quality issues. The system automatically validates your data and provides suggestions for corrections.',
  },
  {
    target: '[data-tour="ai-query-tab"]',
    content: 'Step 4: Use AI Query to ask natural language questions about your data. For example: "Show me all tasks assigned to John" or "Which clients have the highest project values?"',
  },
  {
    target: '[data-tour="ai-corrections-tab"]',
    content: 'Step 5: The AI Corrections tab helps you automatically fix data quality issues using AI suggestions. It can correct formatting, fill missing values, and standardize data.',
  },
  {
    target: '[data-tour="rules-tab"]',
    content: 'Step 6: Create business rules in the Rules tab. You can write rules in plain English or use the structured rule builder to enforce data quality and business logic.',
  },
  {
    target: '[data-tour="export-tab"]',
    content: 'Step 7: Finally, export your processed and validated data in various formats (CSV, Excel, JSON). You can export individual datasets or create a complete package with all your data, rules, and validation reports.',
  },
  {
    target: 'body',
    content: 'That\'s it! You now know how to use Digitalyzz for complete data processing workflow. You can always revisit any step as needed. Happy data processing!',
    placement: 'center',
  },
];

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [run, setRun] = useState(() => {
    try {
      return !window.localStorage.getItem(TOUR_SEEN_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (window.localStorage.getItem(TOUR_SEEN_KEY)) {
        setRun(false);
      }
    } catch {
      setRun(false);
    }
  }, []);

  const handleTourEnd = (data: CallBackProps) => {
    console.log('Tour ended with status:', data.status);
    try {
      if (data.status === 'finished' || data.status === 'skipped') {
        window.localStorage.setItem(TOUR_SEEN_KEY, 'true');
        setRun(false);
      }
    } catch {
      setRun(false);
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showSkipButton
        showProgress
        callback={handleTourEnd}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: '#2563eb',
          },
          tooltip: {
            fontSize: 16,
            padding: 20,
          },
          tooltipContent: {
            padding: '20px 10px',
          },
          buttonNext: {
            backgroundColor: '#2563eb',
            fontSize: 14,
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#6b7280',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#6b7280',
          },
        }}
        locale={{
          back: 'Previous',
          close: 'Close',
          last: 'Finish Tour',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      {children}
    </>
  );
};
