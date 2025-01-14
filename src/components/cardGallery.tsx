import ReactCountryFlag from 'react-country-flag';
import { MapRef } from 'react-map-gl';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { GRANULARITIES, granularitySwitcher, GRANULARITY_CUTOFF } from '../utils/mapping';
import { TravelDestination, TravelPlace, TravelPhoto } from '../types/travel';
import { Dispatch, SetStateAction } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

import { BreakpointKeys, Orientation } from '../utils/display';
import { noImages } from '../utils/images';
import { useTheme } from '@mui/material';

interface CardGalleryProps {
  destinations: TravelDestination[];
  destinationCardPhotos: Record<string, TravelPhoto>;
  places: Record<string, TravelPlace[]>;
  renderablePlaces: TravelPlace[];
  mapGranularity: GRANULARITIES;
  setHoverId: (value: string | null) => void;
  mapRef: MapRef | undefined;
  photos: Record<string, TravelPhoto[]>;
  setPreparedImages: (place: TravelPlace) => void;
  setGalleryOpen: Dispatch<SetStateAction<boolean>>;
  photosLoaded: boolean;
  mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>;
}

export default function cardGallery(props: CardGalleryProps) {
  const cardOnMouseOver = (data: TravelDestination | TravelPlace) => {
    props.setHoverId(data.placeId);
    if (props.mapRef) {
      props.mapRef?.flyTo({
        center: [data.coords.lng, data.coords.lat],
        zoom: props.mapRef.getZoom(),
      });
    }
  };

  const cardOnMouseOut = () => {
    props.setHoverId(null);
  };

  const onCardClickDestination = (_: any, destination: TravelDestination) => {
    props.mapRef?.flyTo({
      center: [destination.coords.lng, destination.coords.lat],
      zoom: GRANULARITY_CUTOFF + 1,
      duration: 2000,
    });
  };

  const onCardClickPlace = (_: any, place: TravelPlace) => {
    props.setPreparedImages(place);
    props.setGalleryOpen(true);
  };

  const theme = useTheme();

  const generateDestinationCards = (destination: TravelDestination) => {
    const photo = props.destinationCardPhotos[destination.placeId];
    const imageSrc = photo ? photo.thumbnailSrc : noImages;
    return (
      <Card
        style={{ borderRadius: 10 }}
        sx={{
          'height': '90%',
          'width': '90%',
          'cursor': 'pointer',
          'display': 'grid',
          'alignItems': 'center',
          'gridTemplateColumns': '1fr',
          'gridTemplateRows': 'minmax(0, 2fr) minmax(0, 1fr)',
          'borderRadius': 10,
          '&:hover': {
            height: '92%',
            width: '92%',
            boxShadow: theme.shadows[20],
          },
        }}
        onMouseOver={() => cardOnMouseOver(destination)}
        onMouseOut={cardOnMouseOut}
        onClick={(e) => onCardClickDestination(e, destination)}
      >
        {props.photosLoaded ? (
          <CardMedia
            component='img'
            image={imageSrc}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              margin: 'auto',
            }}
            // classes={{
            //   media: classes.cardImage,
            // }}
          />
        ) : (
          <CircularProgress style={{ margin: 'auto' }} />
        )}
        <CardContent
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 1fr)',
            gridTemplateRows: '1fr',
            alignItems: 'center',
            height: '100%',
            padding: '6px !important',
          }}
        >
          <Typography
            // classes={{
            //   root: classes.cardText,
            // }}
            sx={{
              fontFamily: 'EB Garamond, serif !important',
              fontSize: '12px !important',
              padding: '0 !important',
              marginLeft: '10px !important',
            }}
            variant='body1'
            color='text.primary'
          >
            {destination.name}, {destination.country}
          </Typography>

          <ReactCountryFlag
            countryCode={destination.countryCode}
            svg
            style={{
              height: 'auto',
              width: '60%',
              margin: 'auto',
              boxShadow: '0px 0px 10px 2px rgb(0 0 0 / 40%)',
            }}
          />
        </CardContent>
      </Card>
    );
  };

  const generatePlaceCard = (place: TravelPlace) => {
    const photo = place.placeId in props.photos ? props.photos[place.placeId][0] : null;
    const imageSrc = photo ? photo.thumbnailSrc : noImages;

    return (
      <Card
        style={{ borderRadius: 10 }}
        sx={{
          'height': '90%',
          'width': '90%',
          'cursor': 'pointer',
          'display': 'grid',
          'alignItems': 'center',
          'gridTemplateColumns': '1fr',
          'gridTemplateRows': 'minmax(0, 2fr) minmax(0, 1fr)',
          'borderRadius': 10,
          '&:hover': {
            height: '92%',
            width: '92%',
            boxShadow: theme.shadows[20],
          },
        }}
        onMouseOver={() => cardOnMouseOver(place)}
        onMouseOut={cardOnMouseOut}
        onClick={(e) => onCardClickPlace(e, place)}
      >
        {props.photosLoaded ? (
          <CardMedia
            component='img'
            image={imageSrc}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              margin: 'auto',
            }}
          />
        ) : (
          <CircularProgress style={{ margin: 'auto' }} />
        )}
        <CardContent>
          <Typography
            // classes={{
            //   root: classes.cardText,
            // }}
            sx={{
              fontFamily: 'EB Garamond, serif !important',
              fontSize: '12px !important',
              padding: '0 !important',
              marginLeft: '10px !important',
            }}
            variant='body1'
            color='text.primary'
          >
            {place.name}, {place.city}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const cardGenerator = granularitySwitcher(
    props.mapGranularity,
    () => props.destinations.map((destination) => generateDestinationCards(destination)),
    () => props.renderablePlaces.map((place) => generatePlaceCard(place)),
  );

  const cards = cardGenerator();

  let gridTemplateColumns;
  if (props.mediaQueries[Orientation.WIDTH][BreakpointKeys.md]) {
    gridTemplateColumns = '1fr 1fr 1fr';
  } else {
    gridTemplateColumns = '1fr 1fr';
  }

  let gridAutoRows;
  if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.lg]) {
    gridAutoRows = '30%';
  } else if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.md]) {
    gridAutoRows = '40%';
  } else if (props.mediaQueries[Orientation.HEIGHT][BreakpointKeys.sm]) {
    gridAutoRows = '50%';
  } else {
    gridAutoRows = '60%';
  }

  return (
    <div
      style={{
        gridAutoRows: gridAutoRows,
        gridTemplateColumns: gridTemplateColumns,
        width: '100%',
        height: '100%',
        display: 'grid',
        justifyItems: 'center',
        alignItems: 'center',
        overflowY: 'scroll',
      }}
    >
      {cards}
    </div>
  );
}
