import { useState, useEffect, SyntheticEvent } from 'react';
import { MapRef } from 'react-map-gl';
import Map from '../components/map';
import ImageViewer from '../components/imageViewer';
import CardGallery from '../components/cardGallery';
import ImageGallery from '../components/imageGallery';
import { MILES_FROM_CITY, getDistanceBetweenTwoPoints } from '../utils/mapping';
import { GRANULARITY_CUTOFF, GRANULARITIES } from '../utils/mapping';
import { TravelDestination, TravelPlace, TravelPhoto } from '../types/travel';
import { BreakpointKeys, Orientation } from '../utils/display';
import { Paper, useTheme } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';
import { doPagination } from '../utils/backend';

const client = generateClient<Schema>();

export interface TravelProps {
  mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>;
}

export default function Travel(props: TravelProps) {
  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [places, setPlaces] = useState<Record<string, TravelPlace[]>>({});
  const [renderablePlaces, setRenderablePlaces] = useState<TravelPlace[]>([]);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [preparedImages, _setPreparedImages] = useState<TravelPhoto[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currImg, setCurrImg] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [mapRef, setMapRef] = useState<MapRef>();
  const [mapGranularity, _setMapGranularity] = useState<GRANULARITIES>(GRANULARITIES.DESTINATIONS);

  const [height, setHeight] = useState(window.innerHeight * 0.92);
  window.addEventListener('resize', () => {
    if (window.innerHeight !== height) setHeight(window.innerHeight * 0.92);
  });

  const theme = useTheme();

  const setDestinationsSorted = (destinations: TravelDestination[]) => {
    const sortedDestinations = destinations.sort((a, b) => {
      return a.country.localeCompare(b.country);
    });
    setDestinations(sortedDestinations);
  };

  const setMapGranularity = (zoom: number) => {
    if (zoom > GRANULARITY_CUTOFF) {
      _setMapGranularity(GRANULARITIES.PLACES);
    } else {
      _setMapGranularity(GRANULARITIES.DESTINATIONS);
    }
  };

  // Photos are read one place at a time, off the placeId index, when a gallery is
  // opened. Fetching the whole table up front meant every visitor paged through
  // all ~10k photos before a single card could render.
  const setPreparedImages = (place: TravelPlace) => {
    _setPreparedImages([]);
    setGalleryLoading(true);
    doPagination<TravelPhoto>((page) =>
      client.models.TravelPhoto.listTravelPhotoByPlaceId({ placeId: place.placeId, ...page }),
    )
      .then((photos) => _setPreparedImages(photos))
      .catch((err) => {
        console.error(`Failed to load photos for place ${place.placeId}`, err);
        _setPreparedImages([]);
      })
      .finally(() => setGalleryLoading(false));
  };

  useEffect(() => {
    client.models.TravelDestination.list().then((resp) => {
      setDestinationsSorted(resp.data);
    });
  }, []);

  useEffect(() => {
    if (!destinations) return;

    doPagination<TravelPlace>((page) => client.models.TravelPlace.list(page)).then((places) => {
      const result: Record<string, TravelPlace[]> = places.reduce((map, place) => {
        const array = map[place.destinationId] ? map[place.destinationId] : [];
        array.push(place);
        const sortedArray = array.sort((a: TravelPlace, b: TravelPlace) => {
          return a.name.localeCompare(b.name);
        });
        map[place.destinationId] = sortedArray;
        return map;
      }, {} as Record<string, TravelPlace[]>);
      setPlaces(result);
    });
  }, []);

  const updateRenderablePlaces = () => {
    const mapCenter = mapRef?.getCenter();
    if (!mapCenter) return;

    let closestDestination: TravelDestination | undefined;
    let closestDestinationDistance = Infinity;
    destinations.forEach((obj) => {
      const distance = getDistanceBetweenTwoPoints(obj.coords.lat, obj.coords.lng, mapCenter.lat, mapCenter.lng);
      if (distance < closestDestinationDistance) {
        closestDestination = obj;
        closestDestinationDistance = distance;
      }
    });

    if (!closestDestination) return;

    if (closestDestinationDistance <= MILES_FROM_CITY && places && closestDestination!.placeId in places) {
      setRenderablePlaces(places[closestDestination!.placeId]);
    } else {
      setRenderablePlaces([]);
    }
  };

  const galleryOnClick = (_: SyntheticEvent, index: number) => {
    setCurrImg(index);
    setGalleryOpen(false);
    setImageViewerOpen(true);
  };

  //Image Viewer Functions
  const toggleViewer = (value = false) => {
    setImageViewerOpen(value);
    setGalleryOpen(!value);
  };

  const isMapVisible = props.mediaQueries[Orientation.WIDTH][BreakpointKeys.sm]!;
  const gridTemplateColumns = isMapVisible ? '1fr 1fr' : '0 1fr';

  return (
    <div style={{ height: height, backgroundColor: theme.palette.background.default }}>
      <Paper
        elevation={24}
        sx={{
          display: 'grid',
          width: '90%',
          marginBottom: 0,
          marginLeft: '5%',
          marginRight: '5%',
          height: '100%',
          gridTemplateColumns: gridTemplateColumns,
        }}
      >
        <Map
          destinations={destinations}
          renderablePlaces={renderablePlaces}
          hoverId={hoverId}
          setHoverId={setHoverId}
          setMapRef={setMapRef}
          mapGranularity={mapGranularity}
          setMapGranularity={setMapGranularity}
          updateRenderablePlaces={updateRenderablePlaces}
          setPreparedImages={setPreparedImages}
          setGalleryOpen={setGalleryOpen}
          isVisible={isMapVisible}
        />
        <CardGallery
          destinations={destinations}
          places={places}
          renderablePlaces={renderablePlaces}
          mapGranularity={mapGranularity}
          setHoverId={setHoverId}
          mapRef={mapRef}
          setGalleryOpen={setGalleryOpen}
          setPreparedImages={setPreparedImages}
          mediaQueries={props.mediaQueries}
        />
      </Paper>

      <ImageGallery
        galleryOpen={galleryOpen}
        galleryOnClick={galleryOnClick}
        preparedImages={preparedImages}
        setGalleryOpen={setGalleryOpen}
        loading={galleryLoading}
      />

      <ImageViewer
        isOpen={imageViewerOpen}
        toggleViewer={toggleViewer}
        views={preparedImages}
        currentIndex={currImg!}
      />
    </div>
  );
}
