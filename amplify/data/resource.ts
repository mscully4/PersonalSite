import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a
  .schema({
    Coords: a.customType({
      lat: a.float().required(),
      lng: a.float().required(),
    }),
    Destination: a
      .model({
        destinationId: a.string().required(),
        country: a.string().required(),
        coords: a.ref('Coords').required(),
        name: a.string().required(),
        places: a.hasMany('Place', 'destinationId'),
      })
      .identifier(['destinationId'])
      .authorization((allow) => [allow.publicApiKey().to(['read'])]),
    Place: a
      .model({
        placeId: a.string().required(),
        address: a.string(),
        city: a.string(),
        state: a.string(),
        zipCode: a.string(),
        country: a.string(),
        destinationId: a.string().required(),
        destination: a.belongsTo('Destination', 'destinationId'),
        coords: a.ref('Coords').required(),
        name: a.string().required(),
        album: a.hasOne('Album', ['placeId', 'albumId']),
      })
      .identifier(['destinationId', 'placeId']),
    Album: a
      .model({
        placeId: a.string().required(),
        destinationId: a.string().required(),
        albumId: a.string().required(),
        title: a.string().required(),
        place: a.belongsTo('Place', ['placeId', 'albumId']),
        photos: a.hasMany('Photo', ['albumId', 'photoId'])
      })
      .identifier(['placeId', 'albumId']),
    Photo: a
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
        album: a.belongsTo('Album', ['albumId', 'photoId'])

      })
      .identifier(['albumId', 'photoId']),
  })
  .authorization((allow) => [allow.publicApiKey().to(['read'])]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
