import { useState, useEffect } from 'react';
import Gallery from 'react-photo-gallery';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface HomeGalleryPhoto {
  height: number;
  width: number;
  src: string;
}

export default function Home() {
  const [images, setImages] = useState<HomeGalleryPhoto[]>([]);

  useEffect(() => {
    client.models.HomePhoto.list({ limit: 100 }).then((resp) => {
      setImages(
        resp.data.map((obj) => ({
          width: parseInt(obj.width),
          height: parseInt(obj.height),
          src: obj.src,
        })),
      );
    });
  }, []);

  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <div
        style={{
          height: '100%',
          overflow: 'scroll',
          scrollbarWidth: 'none',
        }}
      >
        <Gallery photos={images} />
        <p
          style={{
            textAlign: 'center',
          }}
        ></p>
      </div>
    </div>
  );
}
