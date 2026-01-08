export const isMobile = () => {
  return window.innerWidth <= 768;
};

export const isTablet = () => {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};

import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [device, setDevice] = useState({
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop()
  });

  useEffect(() => {
    const handleResize = () => {
      setDevice({
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop()
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
};

