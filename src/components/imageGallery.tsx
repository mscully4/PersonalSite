import Modal from "@material-ui/core/Modal";
import { makeStyles, Theme } from "@material-ui/core/styles";
import Photo from "../types/photo";
import Gallery from "react-photo-gallery";
import { SyntheticEvent } from "react";

const styles = makeStyles((theme: Theme) => ({
  modal: {
    width: "90%",
    margin: "5%",
    overflow: "scroll",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  imageListItem: {
    cursor: "pointer",
  },
}));

interface ImageGalleryProps {
  galleryOpen: boolean;
  setGalleryOpen: (value: boolean) => void;
  preparedImages: Photo[];
  galleryOnClick: (event: SyntheticEvent, index: number) => void;
}

export default function ImageGallery(props: ImageGalleryProps) {
  const classes = styles();

  const photos = props.preparedImages.map((image) => ({
    src: image.thumbnailSrc,
    width: image.width,
    height: image.height,
  }));

  return (
    <Modal
      open={props.galleryOpen}
      onClose={() => props.setGalleryOpen(false)}
      className={classes.modal}
      style={{
        zIndex: 99999999999,
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
