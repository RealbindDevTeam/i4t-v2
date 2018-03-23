import { CollectionObject } from '../collection-object.model';
import { PricePoints } from "./bag-plan.model";

/**
 * BagPlans model
 */
export interface BagPlanHistory extends CollectionObject {
    plan_name: string;
    plan_label: string;
    value_points: number;
    price: PricePoints;
    establishments_ids: string[];
    negative_value_points?: PricePoints;
}