import Viewer from 'react-viewer';
import { TravelPhoto } from '../types/travel';

interface ImageViewerProps {
  isOpen: boolean;
  toggleViewer: (value: boolean) => void;
  views: TravelPhoto[];
  currentIndex: number;
}

export default function ImageViewer(props: ImageViewerProps) {
  const currentIndex = props.currentIndex >= props.views.length ? 0 : props.currentIndex;
  return (
    <Viewer
      visible={props.isOpen}
      activeIndex={currentIndex}
      zIndex={999999999}
      onClose={() => {
        props.toggleViewer(false);
      }}
      images={props.views}
      downloadable={true}
      rotatable={false}
      drag={false}
      scalable={false}
      onMaskClick={(e) => {
        if ((e.target as HTMLTextAreaElement).className === 'react-viewer-canvas') {
          props.toggleViewer(false);
        }
      }}
    />
  );
}
