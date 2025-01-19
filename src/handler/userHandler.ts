import { unmarshall } from '@aws-sdk/util-dynamodb';
import { openSearchClient } from '../opensearch/config';
import { OPENSEARCH_INDEX } from '../opensearch';

export class UserHandler implements TableHandler {
  async process(record: any): Promise<void> {
    const { eventName, dynamodb } = record;
    if (!dynamodb) return;

    const newItem = dynamodb.NewImage ? unmarshall(dynamodb.NewImage) : null;
    const oldItem = dynamodb.OldImage ? unmarshall(dynamodb.OldImage) : null;

    switch (eventName) {
      case 'INSERT':
      case 'MODIFY':
        if (newItem) {
          await openSearchClient.index({
            index: OPENSEARCH_INDEX.USERS,
            id: newItem.id.toString(),
            body: newItem,
          });
          console.log(`Indexed record ID: ${newItem.id} into users index`);
        }
        break;

      case 'REMOVE':
        if (oldItem && oldItem.id) {
          await openSearchClient.delete({
            index: OPENSEARCH_INDEX.USERS,
            id: oldItem.id.toString(),
          });
          console.log(`Deleted record ID: ${oldItem.id} from users index`);
        }
        break;

      default:
        console.warn(`Unhandled event type: ${eventName} for users table`);
    }
  }
}
