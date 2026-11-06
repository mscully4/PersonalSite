import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { TravelPhoto } from '../types/travel';

interface ImageViewerProps {
  isOpen: boolean;
  toggleViewer: (value: boolean) => void;
  views: TravelPhoto[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
}

export default function ImageViewer(props: ImageViewerProps) {
  const currentIndex = props.currentIndex >= props.views.length ? 0 : props.currentIndex;
  const slides = props.views.map((photo) => ({
    src: photo.src,
    width: parseFloat(photo.width),
    height: parseFloat(photo.height),
  }));

  return (
    <Lightbox
      open={props.isOpen}
      close={() => props.toggleViewer(false)}
      index={currentIndex}
      slides={slides}
      plugins={[Zoom]}
      on={{ view: ({ index }) => props.setCurrentIndex(index) }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}
