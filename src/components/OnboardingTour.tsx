'use client';

import { useTheme } from 'next-themes';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

const ONBOARDING_STEPS = [
    {
        target: '[data-tour-id="tour-welcome"]',
        content: 'Welcome to Nervia. Your Visual Intelligence Universe begins here.',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="tour-graph"]',
        content: 'This is your exocortex. Each dot is your memory.',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="tour-new-neuron"]',
        content: 'Add your first Source, Memory, or Impulse.',
        disableBeacon: true,
    },
    {
        target: '[data-tour-id="tour-neural-chat"]',
        content: 'Chat with your knowledge here.',
        disableBeacon: true,
    },
];

interface OnboardingTourProps {
    run: boolean;
    onComplete: () => void;
}

export default function OnboardingTour({ run, onComplete }: OnboardingTourProps) {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const handleCallback = (data: { status?: string; action?: string; type: string }) => {
        const { status, action, type } = data;
        if (type === EVENTS.TOUR_END || type === EVENTS.STEP_AFTER) {
            if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
                onComplete();
            }
        }
        if (action === ACTIONS.CLOSE) {
            onComplete();
        }
    };

    const themeStyles = isDark
        ? {
              options: {
                  primaryColor: 'rgb(168, 85, 247)',
                  backgroundColor: 'rgb(23, 23, 23)',
                  textColor: 'rgb(245, 245, 245)',
                  overlayColor: 'rgba(0, 0, 0, 0.75)',
                  arrowColor: 'rgb(23, 23, 23)',
                  zIndex: 10000,
              },
              tooltip: {
                  borderRadius: 12,
                  padding: 20,
                  backgroundColor: 'rgb(23, 23, 23)',
                  color: 'rgb(245, 245, 245)',
              },
              tooltipContent: {
                  color: 'rgb(245, 245, 245)',
              },
              buttonNext: {
                  backgroundColor: 'rgb(168, 85, 247)',
                  color: '#fff',
              },
              buttonBack: {
                  color: 'rgb(212, 212, 212)',
              },
              buttonSkip: {
                  color: 'rgb(163, 163, 163)',
              },
              buttonClose: {
                  color: 'rgb(212, 212, 212)',
              },
          }
        : {
              options: {
                  primaryColor: 'rgb(99, 102, 241)',
                  backgroundColor: '#fff',
                  textColor: 'rgb(23, 23, 23)',
                  overlayColor: 'rgba(0, 0, 0, 0.5)',
                  arrowColor: '#fff',
                  zIndex: 10000,
              },
              tooltip: {
                  borderRadius: 12,
                  padding: 20,
                  backgroundColor: '#fff',
                  color: 'rgb(23, 23, 23)',
              },
              tooltipContent: {
                  color: 'rgb(38, 38, 38)',
              },
              buttonNext: {
                  backgroundColor: 'rgb(99, 102, 241)',
                  color: '#fff',
              },
              buttonBack: {
                  color: 'rgb(82, 82, 82)',
              },
              buttonSkip: {
                  color: 'rgb(115, 115, 115)',
              },
              buttonClose: {
                  color: 'rgb(82, 82, 82)',
              },
          };

    return (
        <Joyride
            steps={ONBOARDING_STEPS}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleCallback}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip',
            }}
            styles={themeStyles}
        />
    );
}
