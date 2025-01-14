import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navigation from "./components/navigation";

import { BreakpointKeys, breakpoints, Orientation } from "./utils/display";
import { useMediaQuery } from "@mui/material";
import Home from "./views/home";
import Travel from "./views/travel";

const client = generateClient<Schema>();

const NAV_HEIGHT_PERC = 0.075;
const MIN_NAV_HEIGHT_PX = 64;



function App() {
  const [height, setHeight] = useState(window.innerHeight);
  window.addEventListener("resize", () => {
    if (window.innerHeight !== height) setHeight(window.innerHeight);
  });
  const navHeight = Math.max(height * NAV_HEIGHT_PERC, MIN_NAV_HEIGHT_PX);

  const mediaQueries: Record<
    Orientation,
    Partial<Record<BreakpointKeys, boolean>>
  > = {
    [Orientation.WIDTH]: {
      [BreakpointKeys.sm]: useMediaQuery(
        `(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.sm]}px)`
      ),
      [BreakpointKeys.md]: useMediaQuery(
        `(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.md]}px)`
      ),
      [BreakpointKeys.lg]: useMediaQuery(
        `(min-width:${breakpoints[Orientation.WIDTH][BreakpointKeys.lg]}px)`
      ),
    },
    [Orientation.HEIGHT]: {
      [BreakpointKeys.sm]: useMediaQuery(
        `(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.sm]}px)`
      ),
      [BreakpointKeys.md]: useMediaQuery(
        `(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.md]}px)`
      ),
      [BreakpointKeys.lg]: useMediaQuery(
        `(min-height:${breakpoints[Orientation.HEIGHT][BreakpointKeys.lg]}px)`
      ),
    }
  }

  useEffect(() => {
    //   client.models.Destination.create({
    //     destinationId: 'foo',
    //     country: 'USA',
    //     coords: {
    //       lat: 12.0,
    //       lng: 13.0
    //     },
    //     name: 'Gary'
    //   }).then(resp => console.log(resp))

    // client.models.Place.create({
    //   placeId: 'bar',
    //   address: '',
    //   city: '',
    //   state: '',
    //   country: '',
    //   coords: {
    //     lat: 14,
    //     lng: 15
    //   },
    //   name: 'soo',
    //   destinationId: dest.destinationId
    // })

    // client.models.Destination.get({
    //   destinationId: 'foo',
    // }).then(resp => {
    //   const dest = resp.data!;
    //   client.models.Place.list({
    //     destinationId: dest.destinationId
    //   }).then(respo => {
    //     console.log(respo)
    //     client.models.Album.create({
    //       placeId: 'baz',
    //       destinationId: dest.destinationId,
    //       albumId: 'foo',
    //       title: 'bar'
    //     }).then(respon => console.log(respon))
    //   })
    // })
  }, []);

  const router = createBrowserRouter([
    {
      path: '/home',
      element: <Home />
    },
    {
      path: '/travel',
      element: <Travel mediaQueries={mediaQueries}/>
    }
    // {
    //   path: '/travel',
    //   element: <Travel mediaQueries={mediaQueries}/>
    // }
  ]);

  return (
    <main>
      <Navigation height={navHeight} mediaQueries={mediaQueries} />
      <div style={{ height: height - navHeight }}>
        <RouterProvider router={router} />

        {/* <BrowserRouter>
          <Switch>
            <Route path="/home" Component={Home} />
          </Switch>
        </BrowserRouter> */}

        {/* <h1>Hi</h1>
        <div>
          🥳 App successfully hosted. Try creating a new todo.
          <br />
          <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
            Review next step of this tutorial.
          </a>
        </div> */}
      </div>
    </main>
  );
}

export default App;
