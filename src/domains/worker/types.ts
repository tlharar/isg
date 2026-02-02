import type { WorkerFormValues } from './schemas/workerSchema';

export interface Worker extends WorkerFormValues {
  id: string;
}
