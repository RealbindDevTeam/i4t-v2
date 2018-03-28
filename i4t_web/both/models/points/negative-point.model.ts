import { CollectionObject } from '../collection-object.model';

/**
 * NegativePoints model
 */
export interface NegativePoint extends CollectionObject {
    establishment_id: string;
    order_id: string;
    user_id: string;
    redeemed_points: number;
    points: number;
    was_cancelled: boolean;
    paid: boolean;
    bag_plans_history_id?: string;
}