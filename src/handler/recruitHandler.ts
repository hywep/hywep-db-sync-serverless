import { unmarshall } from '@aws-sdk/util-dynamodb';
import { openSearchClient } from '../opensearch/config';
import { OPENSEARCH_INDEX } from '../opensearch';

export class RecruitHandler implements TableHandler {
  async process(record: any): Promise<void> {
    const { eventName, dynamodb } = record;
    if (!dynamodb) return;

    const newItem = dynamodb.NewImage ? unmarshall(dynamodb.NewImage) : null;
    const oldItem = dynamodb.OldImage ? unmarshall(dynamodb.OldImage) : null;

    switch (eventName) {
      case 'INSERT':
      case 'MODIFY':
        if (newItem) {
          if (newItem.interviewInfo) {
            newItem.interviewInfo.applicationResultsAnnouncement =
              this.sanitizeDateField(
                newItem.interviewInfo.applicationResultsAnnouncement,
              );
            newItem.interviewInfo.finalResultsAnnouncement =
              this.sanitizeDateField(
                newItem.interviewInfo.finalResultsAnnouncement,
              );

            Object.keys(newItem.interviewInfo).forEach((key) => {
              if (newItem.interviewInfo[key] === undefined) {
                delete newItem.interviewInfo[key];
              }
            });
          }

          await openSearchClient.index({
            index: OPENSEARCH_INDEX.RECRUIT,
            id: newItem.id.toString(),
            body: newItem,
          });
          console.log(`Indexed record ID: ${newItem.id} into recruit index`);
        }
        break;

      case 'REMOVE':
        if (oldItem && oldItem.id) {
          await openSearchClient.delete({
            index: OPENSEARCH_INDEX.RECRUIT,
            id: oldItem.id.toString(),
          });
          console.log(`Deleted record ID: ${oldItem.id} from recruit index`);
        }
        break;

      default:
        console.warn(`Unhandled event type: ${eventName} for recruit table`);
    }
  }

  sanitizeDateField(field: any): any {
    if (field === '') return null;
    if (typeof field === 'string' && isNaN(Date.parse(field))) return undefined;
    return field;
  }
}
