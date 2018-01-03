import { CollectionObject } from '../collection-object.model';

/**
 * Account Model
 */
export interface Account extends CollectionObject {
    restaurantId: string;
    tableId: string;
    status: string;
    total_payment: number;
}