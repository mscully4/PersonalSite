import { createTheme, Theme } from "@mui/material/styles";

export const lightTheme: Theme = createTheme({
  palette: {
    primary: {
      dark: "#235E9A",
      main: "#016aff",
    },
  },
});

export const foo = {
  tuftsBlue: "#1c7ad9",
  blackCoffee: "#342e37",
  eggshell: "#f0ebd8",
  blue: "#016aff",
};

// I tried to sort these in ROYGBIV order
export const pinColors = [
  // Reds
  "#8B0020", // Dark red
  "#F42C04", // Scarlet
  "#FA3C4C", // Salmon
  // Oranges
  "#F28500", // Tangerine
  "#F6B092", // Peach-ish
  // Yellow
  "#FFB30F", // Honey
  "#E9D758", // Arylide
  "#FFD700", // Gold
  // Green
  "#849324", // Olive
  "#23CE6B", // Emerald
  "#80FF72", // Neon
  // Blue
  "#0084FF", // A Darkish blue
  "4D9DE0", // Carolona
  "#3FB1CE", // Turqouise
  "#8EEDF7", // Electric
  // Purple
  "#B892FF", // Valendar
  "#7B4B94", // Royal Purple
  "#7D82B8", // Middle Blue Purple
  "#6153CC", // Purple
];

export const randomPinColor = () => {
  return pinColors[Math.floor(Math.random() * pinColors.length)];
};
