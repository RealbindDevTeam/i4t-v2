import { CollectionObject } from '../collection-object.model';

/**
 * Garnish Food model
 */
export interface GarnishFood extends CollectionObject {
    is_active: boolean;
    name: string;
    restaurants: GarnishFoodRestaurant[];
    prices: GarnishFoodPrice[];
}

/**
 * GarnishFoodRestaurant model
 */
export interface GarnishFoodRestaurant {
    restaurantId: string;
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