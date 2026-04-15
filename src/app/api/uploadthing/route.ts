import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

function resolveUploadThingToken() {
  if (process.env.UPLOADTHING_TOKEN) {
    return process.env.UPLOADTHING_TOKEN;
  }

  if (process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID) {
    const regions = (process.env.UPLOADTHING_REGIONS ?? process.env.UPLOADTHING_REGION ?? 'sea1')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    return Buffer.from(
      JSON.stringify({
        apiKey: process.env.UPLOADTHING_SECRET,
        appId: process.env.UPLOADTHING_APP_ID,
        regions: regions.length ? regions : ['sea1'],
        ingestHost: process.env.UPLOADTHING_INGEST_HOST ?? 'ingest.uploadthing.com',
      })
    ).toString('base64');
  }

  return undefined;
}

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    token: resolveUploadThingToken(),
  },
});
