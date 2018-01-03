import { CollectionObject } from '../collection-object.model';

/**
 * Addition model
 */
export interface Addition extends CollectionObject{
    is_active: boolean;
    name: string;
    restaurants: AdditionRestaurant[];
    prices: AdditionPrice[];
}

/**
 * AdditionInformation model
 */
export interface AdditionRestaurant {
    restaurantId: string;
    price: number;
    additionTax?: number;
}

/**
 * AdditionPrice model
 */
export interface AdditionPrice {
    currencyId: string;
    price: number;
    additionTax?: number;
}