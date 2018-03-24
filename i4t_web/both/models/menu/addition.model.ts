import { CollectionObject } from '../collection-object.model';

/**
 * Addition model
 */
export interface Addition extends CollectionObject{
    is_active: boolean;
    name: string;
    establishments: AdditionEstablishment[];
    prices: AdditionPrice[];
}

/**
 * AdditionEstablishment model
 */
export interface AdditionEstablishment {
    establishment_id: string;
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