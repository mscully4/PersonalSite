import { generateClient } from 'aws-amplify/api';
import { useEffect, useState } from 'react';
import { Photo, RowsPhotoAlbum } from 'react-photo-album';
import { Schema } from '../../amplify/data/resource';
import 'react-photo-album/rows.css';

const client = generateClient<Schema>();

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    client.models.HomePhoto.list({ limit: 100 }).then((resp) => {
      setPhotos(
        resp.data.map((obj) => ({
          width: parseInt(obj.width),
          height: parseInt(obj.height),
          src: obj.src,
          key: obj.hsh,
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
        <RowsPhotoAlbum photos={photos} spacing={8} />

        <p
          style={{
            textAlign: 'center',
          }}
        ></p>
      </div>
    </div>
  );
}
