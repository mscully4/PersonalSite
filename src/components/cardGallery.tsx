import clsx from "clsx";
import ReactCountryFlag from "react-country-flag";
import { MapRef } from "react-map-gl";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { makeStyles, Theme } from "@material-ui/core/styles";
import {
  GRANULARITIES,
  granularitySwitcher,
  GRANULARITY_CUTOFF,
} from "../utils/mapping";
import Destination from "../types/destination";
import Place from "../types/place";
import Photo from "../types/photo";
import { Dispatch, SetStateAction } from "react";
import CircularProgress from "@mui/material/CircularProgress";

import { BreakpointKeys, Orientation } from "../utils/display";
import { noImages } from "../utils/images";

const styles = makeStyles((theme: Theme) => ({
  container: {
    height: "100%",
    width: "100%",
    display: "grid",
    gridTemplateColumns: "1fr",
    gridAutoRows: "40px 1fr",
    overflowY: "hidden",
    alignItems: "center",
  },
  grid: {
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    justifyItems: "center",
    alignItems: "center",
    overflowY: "scroll",
  },
  card: {
    height: "90%",
    width: "90%",
    cursor: "pointer",
    display: "grid",
    alignItems: "center",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "minmax(0, 2fr) minmax(0, 1fr)",
    borderRadius: 10,
    "&:hover": {
      height: "92%",
      width: "92%",
      boxShadow: theme.shadows[20],
    },
  },
  cardContent: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 5fr) minmax(0, 1fr)",
    gridTemplateRows: "1fr",
    alignItems: "center",
    height: "100%",
    padding: "6px !important",
  },
  cardText: {
    fontFamily: "EB Garamond, serif !important",
    fontSize: "12px !important",
    padding: "0 !important",
    marginLeft: "10px !important",
  },
  cardImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    margin: "auto",
  },
  spinner: {
    margin: "auto",
  },
}));

interface CardGalleryProps {
  destinations: Destination[];
  destinationCardPhotos: Record<string, Photo>;
  places: Record<string, Place[]>;
  renderablePlaces: Place[];
  mapGranularity: GRANULARITIES;
  setHoverId: (value: string | null) => void;
  mapRef: MapRef | undefined;
  photos: Record<string, Photo[]>;
  setPreparedImages: (place: Place) => void;
  setGalleryOpen: Dispatch<SetStateAction<boolean>>;
  photosLoaded: boolean;
  mediaQueries: Record<Orientation, Partial<Record<number, boolean>>>;
}

export default function cardGallery(props: CardGalleryProps) {
  const classes = styles();

  const cardOnMouseOver = (data: Destination | Place) => {
    props.setHoverId(data.placeId);
    if (props.mapRef) {
      props.mapRef?.flyTo({
        center: [data.longitude, data.latitude],
        zoom: props.mapRef.getZoom(),
      });
    }
  };

  const cardOnMouseOut = () => {
    props.setHoverId(null);
  };

  const onCardClickDestination = (e, destination: Destination) => {
    props.mapRef?.flyTo({
      center: [destination.longitude, destination.latitude],
      zoom: GRANULARITY_CUTOFF + 1,
      duration: 2000,
    });
  };

  const onCardClickPlace = (e, place: Place) => {
    props.setPreparedImages(place);
    props.setGalleryOpen(true);
  };

  const generateDestinationCards = (destination: Destination) => {
    const photo = props.destinationCardPhotos[destination.placeId];
    const imageSrc = photo ? photo.thumbnailSrc : noImages;
    return (
      <Card
        className={clsx(classes.card)}
        style={{ borderRadius: 10 }}
        onMouseOver={() => cardOnMouseOver(destination)}
        onMouseOut={cardOnMouseOut}
        onClick={(e) => onCardClickDestination(e, destination)}
      >
        {props.photosLoaded ? (
          <CardMedia
            component="img"
            image={imageSrc}
            classes={{
              media: classes.cardImage,
            }}
          />
        ) : (
          <CircularProgress className={classes.spinner} />
        )}
        <CardContent className={clsx(classes.cardContent)}>
          <Typography
            className={clsx(classes.cardText)}
            classes={{
              root: classes.cardText,
            }}
            variant="body1"
            color="text.primary"
          >
            {destination.name}, {destination.country}
          </Typography>

          <ReactCountryFlag
            countryCode={destination.countryCode}
            svg
            style={{
              height: "auto",
              width: "60%",
              margin: "auto",
              boxShadow: "0px 0px 10px 2px rgb(0 0 0 / 40%)",
            }}
          />
        </CardContent>
      </Card>
    );
  };

  const generatePlaceCard = (place: Place) => {
    const photo =
      place.placeId in props.photos ? props.photos[place.placeId][0] : null;
    const imageSrc = photo ? photo.thumbnailSrc : noImages;

    return (
      <Card
        className={clsx(classes.card)}
        style={{ borderRadius: 10 }}
        onMouseOver={() => cardOnMouseOver(place)}
        onMouseOut={cardOnMouseOut}
        onClick={(e) => onCardClickPlace(e, place)}
      >
        {props.photosLoaded ? (
          <CardMedia
            component="img"
            image={imageSrc}
            classes={{
              media: classes.cardImage,
            }}
          />
        ) : (
          <CircularProgress className={classes.spinner} />
        )}
        <CardContent>
          <Typography
            className={clsx(classes.cardText)}
            classes={{
              root: classes.cardText,
            }}
            variant="body1"
            color="text.primary"
          >
            {place.name}, {place.city}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const cardGenerator = granularitySwitcher(
    props.mapGranularity,
    () =>
      props.destinations.map((destination) =>
        generateDestinationCards(destination)
      ),
    () => props.renderablePlaces.map((place) => generatePlaceCard(place))
  );

  const cards = cardGenerator();

  let gridTemplateColumns;
  if (props.mediaQueries[Orientation.WIDTH][BreakpointKeys.md]) {
    gridTemplateColumns = "1fr 1fr 1fr";
  } else {
    gridTemplateColumns = "1fr 1fr";
  }

  let gridAutoRows;
  if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.lg]) {
    gridAutoRows = "30%";
  } else if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.md]) {
    gridAutoRows = "40%";
  } else if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.sm]) {
    gridAutoRows = "50%";
  } else {
    gridAutoRows = "60%";
  }

  return (
    <div
      className={classes.grid}
      style={{
        gridAutoRows: gridAutoRows,
        gridTemplateColumns: gridTemplateColumns,
      }}
    >
      {cards}
    </div>
  );
}
