import { CollectionObject } from '../collection-object.model';

/**
 * Waiter call model
 */
export interface WaiterCallDetail extends CollectionObject {
    establishment_id : string;
    table_id : string;
    user_id : string;
    waiter_id? : string;
    turn? : number;
    status : string;
    queue : string;
    job_id : string;
    type : string;
    order_id? : string;
}