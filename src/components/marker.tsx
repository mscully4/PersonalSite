import { useState } from "react";
import { Marker as MapboxMarker, Popup, PointLike, MapRef } from "react-map-gl";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Destination from "../types/destination";
import Place from "../types/place";
import {
  DEFAULT_PLACE_ZOOM,
  GRANULARITIES,
  granularitySwitcher,
} from "../utils/mapping";
import { randomPinColor } from "../utils/colors";

const styles = makeStyles((theme: Theme) => ({
  pinIcon: {
    height: 41,
    width: 27,
    viewBox: "0 0 27 41",
    display: "block",
    cursor: "pointer",
  },
  popUp: {
    zIndex: 999999,
  },
}));

interface MarkerProps {
  data: Destination | Place;
  hoverId: string | null;
  setHoverId: (val: string | null) => void;
  mapRef: MapRef | null;
  mapGranularity: GRANULARITIES;
  setPreparedImages: (place: Place) => void;
  setGalleryOpen: (prevState: boolean) => void;
}

function Marker(props: MarkerProps) {
  const classes = styles();
  // store the color in state so that it stays consistent across renders
  const [color, setColor] = useState<string>(randomPinColor());
  const { latitude, longitude, placeId } = props.data;

  const offset: Record<string, PointLike> = {
    bottom: [0, -44],
    top: [0, 0],
    left: [15, -27],
    right: [-15, -27],
  };

  const onClickDestination = () => {
    props.mapRef?.setCenter([longitude, latitude]);
    props.mapRef?.zoomTo(DEFAULT_PLACE_ZOOM);
  };

  const onClickPlace = () => {
    props.setPreparedImages(props.data as Place);
    props.setGalleryOpen(true);
  };

  // The more south a marker, the higher its z-index
  const calculatedZIndex = Math.trunc((props.data.latitude * -1 + 90) * 1000);

  const markerOffset: PointLike = [0, 5];

  return (
    <MapboxMarker
      longitude={props.data.longitude}
      latitude={props.data.latitude}
      anchor={"bottom"}
      offset={markerOffset}
      style={{
        // The more south a marker, the higher its z-index
        zIndex: props.hoverId === props.data.placeId ? 99999 : calculatedZIndex,
      }}
    >
      <svg
        className={classes.pinIcon}
        onMouseEnter={() => props.setHoverId(placeId)}
        onMouseLeave={() => props.setHoverId(null)}
        onClick={granularitySwitcher(
          props.mapGranularity,
          onClickDestination,
          onClickPlace
        )}
      >
        <defs>
          <radialGradient id="shadowGradient">
            <stop offset="10%" stopOpacity="0.4"></stop>
            <stop offset="100%" stopOpacity="0.05"></stop>
          </radialGradient>
        </defs>
        <ellipse
          cx="13.5"
          cy="34.8"
          rx="10.5"
          ry="5.25"
          fill="url(#shadowGradient)"
        ></ellipse>
        <path
          fill={color}
          d="M27,13.5C27,19.07 20.25,27 14.75,34.5C14.02,35.5 12.98,35.5 12.25,34.5C6.75,27 0,19.22 0,13.5C0,6.04 6.04,0 13.5,0C20.96,0 27,6.04 27,13.5Z"
        ></path>
        <path
          opacity="0.25"
          d="M13.5,0C6.04,0 0,6.04 0,13.5C0,19.22 6.75,27 12.25,34.5C13,35.52 14.02,35.5 14.75,34.5C20.25,27 27,19.07 27,13.5C27,6.04 20.96,0 13.5,0ZM13.5,1C20.42,1 26,6.58 26,13.5C26,15.9 24.5,19.18 22.22,22.74C19.95,26.3 16.71,30.14 13.94,33.91C13.74,34.18 13.61,34.32 13.5,34.44C13.39,34.32 13.26,34.18 13.06,33.91C10.28,30.13 7.41,26.31 5.02,22.77C2.62,19.23 1,15.95 1,13.5C1,6.58 6.58,1 13.5,1Z"
        ></path>
        <circle fill="white" cx="13.5" cy="13.5" r="5.5"></circle>
      </svg>
      {props.hoverId === placeId ? (
        <Popup
          longitude={longitude}
          latitude={latitude}
          closeButton={false}
          offset={offset}
          closeOnClick={false}
          className={classes.popUp}
        >
          {props.data.name}, {props.data.country}
        </Popup>
      ) : null}
    </MapboxMarker>
  );
}

export default Marker;
