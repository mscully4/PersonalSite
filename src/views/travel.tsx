import { useState, useEffect, SyntheticEvent } from "react";
import clsx from "clsx";
import { MapRef } from "react-map-gl";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { Paper } from "@material-ui/core";
import Map from "../components/map";
import ImageViewer from "../components/imageViewer";
import CardGallery from "../components/cardGallery";
import ImageGallery from "../components/imageGallery";
import { objectKeysSnakeCasetoCamelCase } from "../utils/backend";
import {
  API_TRAVEL_DESTINATIONS,
  API_TRAVEL_PLACES,
  API_TRAVEL_PHOTOS,
  API_TRAVEL_ALBUMS,
} from "../utils/backend";
import { MILES_FROM_CITY, getDistanceBetweenTwoPoints } from "../utils/mapping";
import { GRANULARITY_CUTOFF, GRANULARITIES } from "../utils/mapping";
import Destination from "../types/destination";
import Place from "../types/place";
import Photo from "../types/photo";
import Album from "../types/album";
import { BreakpointKeys, Orientation } from "../utils/display";

const styles = makeStyles((theme: Theme) => ({
  background: {
    backgroundColor: theme.palette.background.default,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    width: "90%",
    marginBottom: 0,
    marginLeft: "5%",
    marginRight: "5%",
    height: "100%",
  },
  noImages: {
    color: theme.palette.text.primary,
    fontSize: "80px",
    paddingTop: "20%",
    paddingBottom: "25%",
    textAlign: "center",
    backgroundColor: "rgba(40, 40, 40, .6)",
    marginTop: "5%",
    visibility: "visible",
  },
}));

export interface TravelProps {
  mediaQueries: Record<Orientation, Partial<Record<BreakpointKeys, boolean>>>;
}

export default function Travel(props: TravelProps) {
  const classes = styles();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [places, setPlaces] = useState<Record<string, Place[]>>({});
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [photosLoaded, setPhotosLoaded] = useState<boolean>(false);
  const [renderablePlaces, setRenderablePlaces] = useState<Place[]>([]);
  const [albums, setAlbums] = useState<Record<string, Album[]>>({});
  const [destinationCardPhotos, setDestinationCardPhotos] = useState<
    Record<string, Photo>
  >({});

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [preparedImages, _setPreparedImages] = useState<Photo[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currImg, setCurrImg] = useState<number | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [mapRef, setMapRef] = useState<MapRef>();
  const [mapGranularity, _setMapGranularity] = useState<GRANULARITIES>(
    GRANULARITIES.DESTINATIONS
  );

  const [height, setHeight] = useState(window.innerHeight * 0.92);
  window.addEventListener("resize", () => {
    if (window.innerHeight !== height) setHeight(window.innerHeight * 0.92);
  });

  const setDestinationsSorted = (destinations: Destination[]) => {
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

  const setPreparedImages = (place: Place) => {
    _setPreparedImages(place.placeId in photos ? photos[place.placeId] : []);
  };

  const rankBestCardPhotos = (photos: Photo[]) => {
    const desiredRatio = 4 / 3;
    return photos.sort((a, b) => {
      const aRatio = a.width / a.height;
      const bRatio = b.width / b.height;
      if (aRatio === bRatio) {
        return 0;
      }
      return Math.abs(desiredRatio - aRatio) < Math.abs(desiredRatio - bRatio)
        ? -1
        : 1;
    });
  };

  useEffect(() => {
    fetch(API_TRAVEL_DESTINATIONS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((resp) => {
      resp
        .json()
        .then((json) => json.map((el) => el.Entity))
        .then((entities) => {
          const destinations: Destination[] = entities.map((el) => {
            el.latitude = parseFloat(el.latitude);
            el.longitude = parseFloat(el.longitude);
            return objectKeysSnakeCasetoCamelCase(el);
          });

          setDestinationsSorted(destinations);
        });
    });

    fetch(API_TRAVEL_PLACES, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((resp) => {
      resp
        .json()
        .then((json) => json.map((el) => el.Entity))
        .then((entities) => {
          // Some minor transformations on the Place objects are needed
          const places: Place[] = entities.map((place) => {
            place.latitude = parseFloat(place.latitude);
            place.longitude = parseFloat(place.longitude);
            return objectKeysSnakeCasetoCamelCase(place);
          });
          // The API call will return a list of places, we convert the flat list of place
          // into a map of Destination -> List<Place>
          const result: Record<string, Place[]> = places.reduce(
            (map, place) => {
              const array = map[place.destinationId]
                ? map[place.destinationId]
                : [];
              array.push(place);
              const sortedArray = array.sort((a: Place, b: Place) => {
                return a.name.localeCompare(b.name);
              });
              map[place.destinationId] = sortedArray;
              return map;
            },
            {}
          );
          setPlaces(result);
        });
    });

    fetch(API_TRAVEL_PHOTOS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((resp) => {
      resp
        .json()
        .then((json) => json.map((el) => el.Entity))
        .then((entities) => {
          const photos: Photo[] = entities.map((entity) => {
            entity.width = parseFloat(entity.width);
            entity.height = parseFloat(entity.height);
            return objectKeysSnakeCasetoCamelCase(entity);
          });

          const photoMapping = photos.reduce((map, photo) => {
            map[photo.placeId] = [photo].concat(
              map[photo.placeId] ? map[photo.placeId] : []
            );
            return map;
          }, {});

          Object.keys(photoMapping).forEach((key) => {
            photoMapping[key] = rankBestCardPhotos(photoMapping[key]);
          });

          setPhotos(photoMapping);
          setPhotosLoaded(true);
        });
    });

    fetch(API_TRAVEL_ALBUMS, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((resp) => {
      resp
        .json()
        .then((json) => json.map((el) => el.Entity))
        .then((entities) => {
          const albums = entities
            .map((entity) => objectKeysSnakeCasetoCamelCase(entity))
            .reduce((map, album) => {
              map[album.placeId] = [album].concat(
                map[album.placeId] ? map[album.placeId] : []
              );
              return map;
            }, {});

          setAlbums(albums);
        });
    });
  }, []);

  useEffect(() => {
    const destinationPhotoMap: Record<string, Photo> = {};
    destinations
      .filter((destination) => destination.placeId in places)
      .forEach((destination) => {
        const photoList: Photo[] = places[destination.placeId]
          .filter((place) => place.placeId in photos)
          .map((place) => photos[place.placeId][0]);
        destinationPhotoMap[destination.placeId] =
          rankBestCardPhotos(photoList)[0];
      });
    setDestinationCardPhotos({ ...destinationPhotoMap });
  }, [destinations, places, photos]);

  const updateRenderablePlaces = () => {
    const mapCenter = mapRef?.getCenter();
    if (!mapCenter) return;

    let closestDestination: Destination;
    let closestDestinationDistance = Infinity;
    destinations.forEach((obj) => {
      const distance = getDistanceBetweenTwoPoints(
        obj.latitude,
        obj.longitude,
        mapCenter.lat,
        mapCenter.lng
      );
      if (distance < closestDestinationDistance) {
        closestDestination = obj;
        closestDestinationDistance = distance;
      }
    });

    if (
      closestDestinationDistance <= MILES_FROM_CITY &&
      places &&
      closestDestination!.placeId in places
    ) {
      setRenderablePlaces(places[closestDestination!.placeId]);
    } else {
      setRenderablePlaces([]);
    }
  };

  const galleryOnClick = (event: SyntheticEvent, index: number) => {
    setCurrImg(index);
    setGalleryOpen(false);
    setImageViewerOpen(true);
  };

  //Image Viewer Functions
  const toggleViewer = (value = false) => {
    setImageViewerOpen(value);
    setGalleryOpen(!value);
  };

  const isMapVisible =
    props.mediaQueries[Orientation.WIDTH][BreakpointKeys.sm]!;
  const gridTemplateColumns = isMapVisible ? "1fr 1fr" : "0 1fr";

  return (
    <div style={{ height: height }} className={classes.background}>
      <Paper
        elevation={24}
        className={clsx(classes.main)}
        style={{ gridTemplateColumns: gridTemplateColumns }}
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
          destinationCardPhotos={destinationCardPhotos}
          places={places}
          renderablePlaces={renderablePlaces}
          mapGranularity={mapGranularity}
          setHoverId={setHoverId}
          mapRef={mapRef}
          photos={photos}
          setGalleryOpen={setGalleryOpen}
          setPreparedImages={setPreparedImages}
          photosLoaded={photosLoaded}
          mediaQueries={props.mediaQueries}
        />
      </Paper>

      <ImageGallery
        galleryOpen={galleryOpen}
        galleryOnClick={galleryOnClick}
        preparedImages={preparedImages}
        setGalleryOpen={setGalleryOpen}
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
