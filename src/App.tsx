import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom';
import Navigation from './components/navigation';

import { BreakpointKeys, breakpoints, Orientation } from './utils/display';
import { useWindowHeight } from './utils/useWindowHeight';
import { CircularProgress, useMediaQuery } from '@mui/material';
import Home from './views/home';

// Travel pulls in mapbox-gl, which is by far the largest thing the site ships.
// Loading it lazily keeps it off the home page, which has no map.
const Travel = lazy(() => import('./views/travel'));

const NAV_HEIGHT_PERC = 0.075;
const MIN_NAV_HEIGHT_PX = 64;

type MediaQueries = Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>;

interface LayoutProps {
  height: number;
  navHeight: number;
  mediaQueries: MediaQueries;
}

/**
 * Chrome that wraps every route.
 *
 * Navigation sits inside the router rather than above RouterProvider so that it
 * has router context and can use Link. Rendered outside, its only option was a
 * plain anchor, which reloaded the whole app -- bundle, fonts and all -- on
 * every click between Home and Travel.
 */
function Layout(props: LayoutProps) {
  return (
    <main>
      <Navigation height={props.navHeight} mediaQueries={props.mediaQueries} />
      <div style={{ height: props.height - props.navHeight }}>
        <Outlet />
      </div>
    </main>
  );
}

function App() {
  const height = useWindowHeight();
  const navHeight = Math.max(height * NAV_HEIGHT_PERC, MIN_NAV_HEIGHT_PX);

  const mediaQueries: MediaQueries = {
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
      element: <Layout height={height} navHeight={navHeight} mediaQueries={mediaQueries} />,
      children: [
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
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
