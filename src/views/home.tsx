import { useState, useEffect } from "react";
import Gallery from "react-photo-gallery";
import preval from "preval.macro";
import { makeStyles, Theme } from "@material-ui/core/styles";
import { API_HOME_PHOTOS } from "../utils/backend";
import { getRandomSubarray } from "../utils/formulas";
import { objectKeysSnakeCasetoCamelCase } from "../utils/backend";
import Photo from "../types/photo";

const NUMBER_OF_PHOTOS = 100;

const styles = makeStyles((theme: Theme) => ({
  container: {
    height: "100%",
  },
  gallery: {
    height: "100%",
    overflow: "scroll",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  buildInfo: {
    textAlign: "center",
  },
}));

export default function Home() {
  const classes = styles();

  const [images, setImages] = useState<Photo[]>([]);

  useEffect(() => {
    fetch(API_HOME_PHOTOS)
      .then((res) => res.json())
      .then((json) => json.map((el) => el.Entity))
      .then((json) => {
        json.map((obj) => {
          obj.width = parseInt(obj.width);
          obj.height = parseInt(obj.height);
          return objectKeysSnakeCasetoCamelCase(obj);
        });
        setImages(getRandomSubarray(json, NUMBER_OF_PHOTOS));
      });
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.gallery}>
        <Gallery photos={images} />
        <p className={classes.buildInfo}>
          Build Date: {preval`module.exports = new Date().toLocaleString();`}.
        </p>
      </div>
    </div>
  );
}
