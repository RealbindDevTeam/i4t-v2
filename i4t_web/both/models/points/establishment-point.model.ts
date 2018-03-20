import { CollectionObject } from '../collection-object.model';

/**
 * EstablishmentPoints model
 */
export interface EstablishmentPoint extends CollectionObject {
    establishments_ids: string[];
    current_points: number;
    negative_balance: boolean;
    negative_advice_counter: number;
}