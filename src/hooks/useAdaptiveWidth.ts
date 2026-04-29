import { useState, useEffect } from 'react';

export type WindowSizeClass = 'compact' | 'medium' | 'expanded';

export function useWindowSizeClass() {
  const [sizeClass, setSizeClass] = useState<WindowSizeClass>('compact');

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSizeClass('compact');
      } else if (width < 1200) {
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
