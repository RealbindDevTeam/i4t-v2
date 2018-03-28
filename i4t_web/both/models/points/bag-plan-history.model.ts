import { CollectionObject } from '../collection-object.model';

/**
 * BagPlans model
 */
export interface BagPlanHistory extends CollectionObject {
    plan_name: string;
    plan_label: string;
    value_points: number;
    price: BagPlansPoints;
    establishment_id: string;
    negative_value_points?: BagPlansPoints;
}

/**
 * BagPlansPoints model
 */
export interface BagPlansPoints {
    country_id: string;
    price: number;
    currency: string;
    negative_points?: number;
}