import { CollectionObject } from '../collection-object.model';

/**
 * EstablishmentPoints model
 */
export interface EstablishmentPoint extends CollectionObject {
    establishments_ids: EstablishmentPointDistribution[];
    current_points: number;
    negative_balance: boolean;
    negative_advice_counter: number;
}

/**
 * Establishment Point Distribution Model
 */
export interface EstablishmentPointDistribution {
    establishment_id: string;
    points: number;
}