import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import { photoBucket } from './storage/resource';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AllowedMethods, CachePolicy, Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';

const backend = defineBackend({
  auth,
  data,
  photoBucket,
});

// @aws-amplify/backend 1.25 dropped the DynamoDBEnableServerSideEncryption
// parameter and now synthesizes sseEnabled: false. The deployed stacks have it
// set to true, so without this the upgrade would silently move every table off
// its AWS-managed KMS key onto an AWS-owned one. Pin it back on explicitly.
const { amplifyDynamoDbTables } = backend.data.resources.cfnResources;
for (const table of Object.values(amplifyDynamoDbTables)) {
  table.sseSpecification = { sseEnabled: true };
}

const imagesStack = backend.createStack('ImagesStack');

const bucket = new Bucket(imagesStack, 'PublicImageBucket', {
  publicReadAccess: true,
  blockPublicAccess: new BlockPublicAccess({
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }),
  removalPolicy: RemovalPolicy.RETAIN,
});

new Distribution(imagesStack, 'ImageDistribution', {
  defaultBehavior: {
    origin: S3BucketOrigin.withBucketDefaults(bucket),
    viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    cachePolicy: CachePolicy.CACHING_OPTIMIZED,
  },
});
