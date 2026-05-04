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

// Pre-defined variants for standard UI patterns

// Fade in/out
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: transition.entrance 
  },
  exit: { 
    opacity: 0, 
    transition: transition.exit 
  }
};

// Slide up / Enter
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: transition.entrance 
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    transition: transition.exit 
  }
};

// Slide down / Collapse
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, height: 0, overflow: 'hidden' },
  visible: { 
    opacity: 1, 
    height: 'auto', 
    transition: transition.entrance 
  },
  exit: { 
    opacity: 0, 
    height: 0, 
    transition: transition.exit 
  }
};

// Pop in / Scale (for Modals/Dialogs)
export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: transition.entrance 
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    transition: transition.exit 
  }
};

// Stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: transition.entrance 
  }
};
