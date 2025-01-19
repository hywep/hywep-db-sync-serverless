import { DynamoDBStreamEvent } from 'aws-lambda';
import { RecruitHandler } from './handler/recruitHandler';
import { UserHandler } from './handler/userHandler';

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  const promises = event.Records.map(async (record) => {
    try {
      const tableName = record.eventSourceARN
        ? record.eventSourceARN.split('/')[1]
        : '';
      const handler = getTableHandler(tableName);

      await handler.process(record);
    } catch (error) {
      console.error(
        `Error processing record:`,
        JSON.stringify(record, null, 2),
        '\nError:',
        error,
      );
    }
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Unexpected error during batch processing:', error);
  }
}

function getTableHandler(tableName: string): TableHandler {
  if (tableName.startsWith('hywep-recruit')) {
    return new RecruitHandler();
  }
  if (tableName.startsWith('hywep-users')) {
    return new UserHandler();
  }
  throw new Error(`No handler found for table: ${tableName}`);
}
