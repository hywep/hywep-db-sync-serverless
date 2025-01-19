import { Client as OpenSearchClient } from '@opensearch-project/opensearch';

export const openSearchClient = new OpenSearchClient({
  node: process.env.OPENSEARCH_ENDPOINT,
  auth: {
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
  },
});
