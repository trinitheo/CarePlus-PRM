import { useState, useEffect } from 'react';

export type WindowSizeClass = 'compact' | 'medium' | 'expanded';

/**
 * Breakpoints following Material Design 3 guidelines:
 * - Compact: < 600dp (All phones in portrait)
 * - Medium: 600dp - 839dp (Tablets, foldables, large phones landscape)
 * - Expanded: 840dp+ (Large tablets, laptops, desktops)
 * 
 * Note on iPhone resolutions (Physical vs Logical):
 * - iPhone 14: 1170x2532 physical -> 390x844 logical
 * - iPhone 15: 1290x2796 physical -> 430x932 logical
 */
export function useWindowSizeClass(): WindowSizeClass {
  const [sizeClass, setSizeClass] = useState<WindowSizeClass>('compact');

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setSizeClass('compact');
      } else if (width < 840) {
        setSizeClass('medium');
      } else {
        setSizeClass('expanded');
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return sizeClass;
}
