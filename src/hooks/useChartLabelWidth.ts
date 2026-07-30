import { useEffect, useState } from 'react';

export const useChartLabelWidth = (desktop: number, tablet: number, mobile: number) => {
  const calculate = () => {
    if (typeof window === 'undefined') return desktop;
    if (window.innerWidth < 640) return mobile;
    if (window.innerWidth < 1024) return tablet;
    return desktop;
  };

  const [width, setWidth] = useState(calculate);

  useEffect(() => {
    const update = () => setWidth(calculate());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [desktop, tablet, mobile]);

  return width;
};
