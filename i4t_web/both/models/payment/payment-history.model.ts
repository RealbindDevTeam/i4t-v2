import { CollectionObject } from '../collection-object.model';

export interface PaymentHistory extends CollectionObject {
    restaurantIds: string[];
    startDate: Date;
    endDate: Date;
    month: string;
    year: string;
    status: string;
    paymentTransactionId?: string;
    paymentValue?: number;
    currency?: string;
    isInitial: boolean;
}