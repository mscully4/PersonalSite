// // API Constants
export const API_BASE = "https://api.michaeljscully.com";

export const API_TRAVEL_DESTINATIONS = `${API_BASE}/travel/destinations`;
export const API_TRAVEL_PLACES = `${API_BASE}/travel/places`;
export const API_TRAVEL_PHOTOS = `${API_BASE}/travel/photos`;
export const API_TRAVEL_ALBUMS = `${API_BASE}/travel/albums`;

export const API_HOME_PHOTOS = `${API_BASE}/home/photos`;

export const API_RESUME_JOBS = `${API_BASE}/resume/jobs`;
export const API_RESUME_SKILLS = `${API_BASE}/resume/skills`;
export const API_RESUME_EDUCATION = `${API_BASE}/resume/education`;

export const objectKeysSnakeCasetoCamelCase = (obj: object) => {
  const processVal = (val) =>
    typeof val !== "object"
      ? val
      : Array.isArray(val)
      ? val.map(objectKeysSnakeCasetoCamelCase)
      : objectKeysSnakeCasetoCamelCase(val);

  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.replace(/_(.)/g, (g) => g[1].toUpperCase()),
      processVal(val),
    ])
  );
};

export const objectKeysCamelCaseToSnakeCase = (obj: object) => {
  const processVal = (val) =>
    typeof val !== "object"
      ? val
      : Array.isArray(val)
      ? val.map(objectKeysCamelCaseToSnakeCase)
      : objectKeysCamelCaseToSnakeCase(val);

  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
      processVal(val),
    ])
  );
};
