import { CollectionObject } from '../collection-object.model';

/**
 * Order Model
 */
export interface Order extends CollectionObject {
    establishment_id: string;
    tableId: string;
    code: number;
    status: string;
    items: OrderItem[];
    totalPayment: number;
    orderItemCount: number;
    additions: OrderAddition[];
    total_reward_points?: number;
}

/**
 * Order Item Model
 */
export interface OrderItem {
    index: number;
    itemId: string;
    quantity: number;
    observations: string;
    options: OrderOption[];
    additions: string[];
    paymentItem: number;
    reward_points?: number;
    is_reward?: boolean;
    redeemed_points?: number;
}

/**
 * Order Option Model
 */
export interface OrderOption {
    option_id: string;
    value_id: string;
}

/**
 * Order Addition Model
 */
export interface OrderAddition {
    additionId: string;
    quantity: number;
    paymentAddition: number;
}

/**
 * OptionReference Model
 * Used to reference radio buttons in order detail
 */
export interface OptionReference {
    option_id: string;
    is_required: boolean;
    values: ValueReference[];
}

/**
 * ValueReference Model
 * Used to reference radio buttons in order detail
 */
export interface ValueReference {
    value_id: string;
    price: number;
    in_use: boolean;
}