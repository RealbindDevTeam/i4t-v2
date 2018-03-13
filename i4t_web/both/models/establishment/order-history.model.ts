import { CollectionObject } from '../collection-object.model';

/**
 * Order History Model
 */
export interface OrderHistory extends CollectionObject {
    establishment_id: string;
    establishment_name: string;
    establishment_address: string;
    establishment_phone: string;
    country_id: string;
    order_code: number;
    table_number: number;
    total_order: number;
    customer_id: string;
    currency: string;
    items?: OrderHistoryItem[];
    additions?: OrderHistoryAddition[];
    total_reward_points?: number;
}

/**
 * Order History Item Model
 */
export interface OrderHistoryItem {
    item_name: string;
    quantity: number;
    option_values: OrderHistoryItemOptionValue[];
    additions: OrderHistoryItemAddition[];
    price: number;
    is_reward?: boolean;
    redeemed_points?: number;
}

/**
 * Order History Addition Model
 */
export interface OrderHistoryAddition {
    addition_name: string;
    quantity: number;
    price: number;
}


/**
 * Order History Item Addition Model
 */
export interface OrderHistoryItemAddition {
    addition_name: string,
    price: number
}

/**
 * Order History Item Option Value Model
 */
export interface OrderHistoryItemOptionValue {
    option_value_name: string,
    price?: number
}