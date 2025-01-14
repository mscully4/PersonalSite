import { defineStorage } from "@aws-amplify/backend";

export const photoBucket = defineStorage({
  name: 'photoBucket',
  access: (allow) => ({
    // 'profile-pictures/{entity_id}/*': [
    //   allow.guest.to(['read']),
    //   allow.entity('identity').to(['read', 'write', 'delete'])
    // ],
    'photos/*': [
      allow.authenticated.to(['read','write']),
      allow.guest.to(['read', 'write'])
    ],
  })
  // access: (allow) => ({
  //   'photos/*': allow.guest.to(['read'])
  // })
  // isDefault: true, // identify your default storage bucket (required)
});