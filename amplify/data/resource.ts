import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a
  .schema({
    Coords: a.customType({
      lat: a.float().required(),
      lng: a.float().required(),
    }),
    TravelDestination: a
      .model({
        destinationId: a.string().required(),
        placeId: a.string().required(),
        country: a.string().required(),
        countryCode: a.string().required(),
        coords: a.ref('Coords').required(),
        name: a.string().required(),
        places: a.hasMany('TravelPlace', 'destinationId'),
      })
      .identifier(['destinationId']),
    TravelPlace: a
      .model({
        placeId: a.string().required(),
        address: a.string(),
        city: a.string(),
        state: a.string(),
        country: a.string(),
        destinationId: a.string().required(),
        destination: a.belongsTo('TravelDestination', 'destinationId'),
        coords: a.ref('Coords').required(),
        name: a.string().required(),
        album: a.hasOne('TravelAlbum', ['placeId', 'albumId']),
      })
      .identifier(['destinationId', 'placeId']),
    TravelAlbum: a
      .model({
        placeId: a.string().required(),
        destinationId: a.string().required(),
        albumId: a.string().required(),
        title: a.string().required(),
        place: a.belongsTo('TravelPlace', ['placeId', 'albumId']),
        photos: a.hasMany('TravelPhoto', ['albumId', 'photoId']),
      })
      .identifier(['placeId', 'albumId']),
    TravelPhoto: a
      .model({
        photoId: a.string().required(),
        albumId: a.string().required(),
        placeId: a.string().required(),
        destinationId: a.string().required(),
        src: a.string().required(),
        thumbnailSrc: a.string().required(),
        width: a.string().required(),
        height: a.string().required(),
        hsh: a.string().required(),
        album: a.belongsTo('TravelAlbum', ['albumId', 'photoId']),
      })
      .identifier(['albumId', 'photoId']),
    HomePhoto: a
      .model({
        photoId: a.string().required(),
        src: a.string().required(),
        width: a.string().required(),
        height: a.string().required(),
        hsh: a.string().required(),
      })
      .identifier(['photoId']),
  })
  .authorization((allow) => [allow.publicApiKey()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
