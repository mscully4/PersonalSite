import { defineStorage } from '@aws-amplify/backend';

export const photoBucket = defineStorage({
  name: 'photoBucket',
  access: (allow) => ({
    'photos/*': [allow.authenticated.to(['read', 'write']), allow.guest.to(['read', 'write'])],
  }),
});
