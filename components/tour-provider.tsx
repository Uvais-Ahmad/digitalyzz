"use client"

import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';

const TOUR_SEEN_KEY = 'hasSeenTour';

const steps: Step[] = [
  {
    target: 'body',
    content: '👋 Welcome to Digitalyzz! Let me show you how to process your data from upload to export in just a few simple steps.',
    placement: 'center',
    title: 'Welcome to Your Data Processing Journey',
  },
  {
    target: '[data-tour="file-upload"]',
    content: '📁 Start by uploading your CSV or Excel files here. Our AI will automatically detect and map your data columns for optimal processing.',
    title: 'Step 1: Upload Your Files',
  },
  {
    target: '[data-tour="data-tab"]',
    content: '📊 View and manage your uploaded data here. You can see all clients, workers, and tasks in organized tables with search and filter capabilities.',
    title: 'Step 2: Review Your Data',
  },
  {
    target: '[data-tour="validation-tab"]',
    content: '✅ Check data quality here. Any validation errors or warnings will be highlighted with helpful suggestions for fixes.',
    title: 'Step 3: Validate Data Quality',
  },
  {
    target: '[data-tour="ai-query-tab"]',
    content: '🤖 Ask questions about your data using natural language. Get insights, summaries, and analysis powered by AI.',
    title: 'Step 4: Query Your Data with AI',
  },
  {
    target: '[data-tour="ai-corrections-tab"]',
    content: '🔧 Let AI automatically fix data issues and inconsistencies. Review and apply suggested corrections to improve data quality.',
    title: 'Step 5: AI-Powered Corrections',
  },
  {
    target: '[data-tour="rules-tab"]',
    content: '📋 Create business rules to enforce data standards. Write rules in plain English or use our visual rule builder.',
    title: 'Step 6: Set Up Business Rules',
  },
  {
    target: '[data-tour="export-tab"]',
    content: '📤 Export your processed data in multiple formats (CSV, Excel, JSON). Create complete packages with data, rules, and reports.',
    title: 'Step 7: Export Your Results',
  },
  {
    target: 'body',
    content: '🎉 Congratulations! You now know how to use Digitalyzz for complete data processing. Each step builds on the previous one to ensure high-quality results.',
    placement: 'center',
    title: 'You\'re All Set!',
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
            primaryColor: '#3b82f6',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            arrowColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.3)',
          },
          tooltip: {
            borderRadius: 12,
            padding: 24,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.6,
            maxWidth: 480,
            minWidth: 420,
            width: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          tooltipTitle: {
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 12,
            color: '#111827',
            lineHeight: 1.4,
          },
          tooltipContent: {
            fontSize: 15,
            lineHeight: 1.6,
            color: '#4b5563',
            marginBottom: 20,
          },
          tooltipFooter: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'nowrap',
            marginTop: '16px',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 24px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#ffffff',
          },
          buttonBack: {
            backgroundColor: '#f9fafb',
            color: '#374151',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            padding: '12px 20px',
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          },
          buttonSkip: {
            backgroundColor: 'transparent',
            color: '#6b7280',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '8px 12px',
            whiteSpace: 'nowrap',
          },
          spotlight: {
            borderRadius: 8,
            backgroundColor: 'transparent',
            border: '3px solid #3b82f6',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)',
          },
          beaconInner: {
            backgroundColor: '#3b82f6',
          },
          beaconOuter: {
            backgroundColor: 'rgba(59, 130, 246, 0.3)',
            border: '2px solid #3b82f6',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            mixBlendMode: 'normal',
          },
        }}
        locale={{
          back: '← Previous',
          close: '× Close',
          last: '🎉 Complete Tour',
          next: 'Next →',
          skip: 'Skip for now',
        }}
        floaterProps={{
          disableAnimation: false,
          styles: {
            floater: {
              filter: 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.15))',
            },
          },
        }}
        disableOverlayClose={true}
        disableScrollParentFix={true}
        spotlightClicks={false}
        scrollToFirstStep={true}
        hideCloseButton={false}
      />
      {children}
    </>
  );
};
