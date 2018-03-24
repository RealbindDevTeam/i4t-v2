import { CollectionObject } from '../collection-object.model';

/**
 * BagPlans model
 */
export interface BagPlan extends CollectionObject {
    name: string;
    label: string;
    price: PricePoints;
    value_points: number;
    active: boolean;
}

/**
 * PricePoints model
 */
export interface PricePoints {
    country_id: string;
    price: number;
    currency: string
}