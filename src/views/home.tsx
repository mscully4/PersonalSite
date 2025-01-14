import { useState, useEffect } from "react";
import Gallery from "react-photo-gallery";
// import preval from "preval.macro";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { API_HOME_PHOTOS } from "../utils/backend";
import { getRandomSubarray } from "../utils/formulas";
import { objectKeysSnakeCasetoCamelCase } from "../utils/backend";
import { generateClient } from "aws-amplify/api";
import { Schema } from "../../amplify/data/resource";
import { TravelPhoto } from "../types/travel";

const client = generateClient<Schema>();


const NUMBER_OF_PHOTOS = 100;

// const styles = makeStyles((theme: Theme) => ({
//   container: {
//     height: "100%",
//   },
//   gallery: {
//     height: "100%",
//     overflow: "scroll",
//     scrollbarWidth: "none",
//     "&::-webkit-scrollbar": {
//       display: "none",
//     },
//   },
//   buildInfo: {
//     textAlign: "center",
//   },
// }));

interface HomeGalleryPhoto {
  height: number;
  width: number;
  src: string;
}

export default function Home() {
  const [images, setImages] = useState<HomeGalleryPhoto[]>([]);

  useEffect(() => {
    client.models.HomePhoto.list().then((resp) => {
      console.log(resp);
      setImages(resp.data.map((obj) => (
        {
          width: parseInt(obj.width),
          height: parseInt(obj.height),
          src: obj.src
        }
      )))
    })
  }, []);

  return (
    <div style={{
      height: "100%",
    }}>
      <div style={{
        height: "100%",
        overflow: "scroll",
        scrollbarWidth: "none",
      }}>
        <Gallery photos={images} />
        <p style={{
          textAlign: 'center'
        }}>
          {/* Build Date: {preval`module.exports = new Date().toLocaleString();`}. */}
        </p>
      </div>
    </div>
  );
}
