import { CollectionObject } from '../collection-object.model';

export interface PaymentTransaction extends CollectionObject {
    count: number;
    referenceCode: string;
    status: string;
    responseCode?: string;
    responseOrderId?: string;
    responsetransactionId?: string;
    responseMessage?: string;
}