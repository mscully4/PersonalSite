import { lazy, Suspense, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Navigation from './components/navigation';

import { BreakpointKeys, breakpoints, Orientation } from './utils/display';
import { CircularProgress, useMediaQuery } from '@mui/material';
import Home from './views/home';

// Travel pulls in mapbox-gl, which is by far the largest thing the site ships.
// Loading it lazily keeps it off the home page, which has no map.
const Travel = lazy(() => import('./views/travel'));

const NAV_HEIGHT_PERC = 0.075;
const MIN_NAV_HEIGHT_PX = 64;

function App() {
  const [height, setHeight] = useState(window.innerHeight);
  window.addEventListener('resize', () => {
    if (window.innerHeight !== height) setHeight(window.innerHeight);
  });
  const navHeight = Math.max(height * NAV_HEIGHT_PERC, MIN_NAV_HEIGHT_PX);

  const mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>> = {
    [Orientation.WIDTH]: {
      [BreakpointKeys.sm]: useMediaQuery(`(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.sm]}px)`),
      [BreakpointKeys.md]: useMediaQuery(`(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.md]}px)`),
      [BreakpointKeys.lg]: useMediaQuery(`(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.lg]}px)`),
    },
    [Orientation.HEIGHT]: {
      [BreakpointKeys.sm]: useMediaQuery(`(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.sm]}px)`),
      [BreakpointKeys.md]: useMediaQuery(`(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.md]}px)`),
      [BreakpointKeys.lg]: useMediaQuery(`(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.lg]}px)`),
    },
  };

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home />,
    },
    {
      path: '/home',
      element: <Home />,
    },
    {
      path: '/travel',
      element: (
        <Suspense
          fallback={
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
            </div>
          }
        >
          <Travel mediaQueries={mediaQueries} />
        </Suspense>
      ),
    },
  ]);

  return (
    <main>
      <Navigation height={navHeight} mediaQueries={mediaQueries} />
      <div style={{ height: height - navHeight }}>
        <RouterProvider router={router} />
      </div>
    </main>
  );
}

export default App;
