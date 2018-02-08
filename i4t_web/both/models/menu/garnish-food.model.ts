import { CollectionObject } from '../collection-object.model';

/**
 * Garnish Food model
 */
export interface GarnishFood extends CollectionObject {
    is_active: boolean;
    name: string;
    establishments: GarnishFoodEstablishment[];
    prices: GarnishFoodPrice[];
}

/**
 * GarnishFoodEstablishment model
 */
export interface GarnishFoodEstablishment {
    establishment_id: string;
    price: number;
    garnishFoodTax?: number;
}

/**
 * GarnishFoodPrice model
 */
export interface GarnishFoodPrice {
    currencyId: string;
    price: number;
    garnishFoodTax?: number;
}