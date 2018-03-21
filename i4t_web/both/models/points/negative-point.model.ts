import { CollectionObject } from '../collection-object.model';

/**
 * NegativePoints model
 */
export interface NegativePoint extends CollectionObject {
    establishment_id: string;
    user_id: string;
    points: number;
    paid: boolean;
    bag_plans_history_id: string;
}