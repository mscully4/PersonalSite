import { SyntheticEvent } from 'react';
import { Modal } from '@mui/material';
import { TravelPhoto } from '../types/travel';
import { RowsPhotoAlbum, Photo } from 'react-photo-album';
import 'react-photo-album/rows.css';

interface ImageGalleryProps {
  galleryOpen: boolean;
  setGalleryOpen: (value: boolean) => void;
  preparedImages: TravelPhoto[];
  galleryOnClick: (event: SyntheticEvent, index: number) => void;
}

export default function ImageGallery(props: ImageGalleryProps) {
  const photos: Photo[] = props.preparedImages.map((image) => ({
    src: image.thumbnailSrc,
    width: parseFloat(image.width),
    height: parseFloat(image.height),
    key: image.hsh,
  }));

  return (
    <Modal
      open={props.galleryOpen}
      onClose={() => props.setGalleryOpen(false)}
      sx={{
        'zIndex': 99999999999,
        'width': '90%',
        'margin': '5%',
        'overflow': 'scroll',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        'backgroundColor': 'white',
      }}
    >
      <RowsPhotoAlbum
        spacing={8}
        photos={photos}
        componentsProps={{
          container: {
            style: {
              backgroundColor: '#fff',
            },
          },
        }}
      />
    </Modal>
  );
}
