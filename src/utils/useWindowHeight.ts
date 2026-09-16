import { useEffect, useState } from 'react';

/**
 * Track window.innerHeight across resizes.
 *
 * App and the travel view both used to call window.addEventListener('resize', ...)
 * directly in the render body, which registered another listener on every render
 * and removed none of them.
 *
 * @param scale fraction of the window height to return, e.g. 0.92
 */
export function useWindowHeight(scale = 1) {
  const [height, setHeight] = useState(window.innerHeight * scale);

  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight * scale);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [scale]);

  return height;
}
