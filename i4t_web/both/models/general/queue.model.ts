import { CollectionObject } from '../collection-object.model';
/**
 * Queue Method model
 */
export interface Queue extends CollectionObject {
    queues: QueueName[];
}

/**
 * QueueNames Method model
 */
export interface QueueName extends CollectionObject {
    name : string;
}