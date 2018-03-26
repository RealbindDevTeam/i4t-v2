import { CollectionObject } from '../collection-object.model';

/**
 * EstablishmentPoints model
 */
export interface EstablishmentPoint extends CollectionObject {
    establishment_id: string;
    current_points: number;
    negative_balance: boolean;
    negative_advice_counter: number;
}