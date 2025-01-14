import Gallery from "react-photo-gallery";
import { SyntheticEvent } from "react";
import { Modal } from "@mui/material";
import { TravelPhoto } from "../types/travel";

interface ImageGalleryProps {
  galleryOpen: boolean;
  setGalleryOpen: (value: boolean) => void;
  preparedImages: TravelPhoto[];
  galleryOnClick: (event: SyntheticEvent, index: number) => void;
}

export default function ImageGallery(props: ImageGalleryProps) {

  const photos = props.preparedImages.map((image) => ({
    src: image.thumbnailSrc,
    width: parseFloat(image.width),
    height: parseFloat(image.height),
  }));

  return (
    <Modal
      open={props.galleryOpen}
      onClose={() => props.setGalleryOpen(false)}
      sx={{
        zIndex: 99999999999,
        width: "90%",
        margin: "5%",
        overflow: "scroll",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <Gallery
        photos={photos}
        onClick={(e, obj) => {
          props.galleryOnClick(e, obj.index);
        }}
      />
    </Modal>
  );
}
