import { CollectionObject } from '../collection-object.model';

/**
 * Order Model
 */
export interface Order extends CollectionObject{
    establishment_id: string;
    tableId: string;
    code: number;
    status: string;
    items: OrderItem[];
    totalPayment: number;
    orderItemCount: number;
    additions: OrderAddition[];
}

/**
 * Order Item Model
 */
export interface OrderItem{
    index: number;
    itemId: string;
    quantity: number;
    observations: string;
    garnishFood: string[];
    additions: string[];
    paymentItem: number;
}

/**
 * Order Addition Model
 */
export interface OrderAddition{
    additionId: string;
    quantity: number;
    paymentAddition: number;
}