import { EventEmitter } from 'events';
import { startStream, types } from 'near-lake-framework';

export const lakeEmitter = new EventEmitter();

export async function startLakeStream(): Promise<void> {
  const network = process.env.NEAR_NETWORK || 'testnet';
  const startBlockHeight = Number(process.env.LAKE_START_BLOCK || '0');

  const lakeConfig: types.LakeConfig = {
    s3BucketName: network === 'mainnet' ? 'near-lake-data-mainnet' : 'near-lake-data-testnet',
    s3RegionName: 'eu-central-1',
    startBlockHeight,
  };

  await startStream(lakeConfig, (streamerMessage) => {
    for (const shard of streamerMessage.shards) {
      for (const outcome of shard.receiptExecutionOutcomes) {
        const { receipt, executionOutcome } = outcome;
        const receiver = receipt.receiverId || '';
        const executor = executionOutcome.outcome.executorId || '';
        if (receiver.includes('aurora') || executor.includes('aurora')) {
          lakeEmitter.emit('aurora', { receipt, outcome: executionOutcome });
        }
      }
    }
  });
}
