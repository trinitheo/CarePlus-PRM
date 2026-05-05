import { Variants } from 'motion/react';

// Fluent 2 Duration (in seconds for Framer Motion)
export const duration = {
  faster: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.4,
};

// Fluent 2 Easings
export const easing = {
  // Use for entering screen (Decelerate)
  entrance: [0.1, 0.9, 0.2, 1] as const,
  // Use for exiting screen (Accelerate)
  exit: [0.9, 0.1, 1, 0.2] as const,
  // Use for state changes within the screen (Standard/Point to Point)
  standard: [0, 0, 0, 1] as const,
};

// Common Fluent 2 Transition Configurations
export const transition = {
  entrance: { duration: duration.normal, ease: easing.entrance },
  exit: { duration: duration.fast, ease: easing.exit },
  standard: { duration: duration.normal, ease: easing.standard },
  slowEntrance: { duration: duration.slow, ease: easing.entrance },
};
