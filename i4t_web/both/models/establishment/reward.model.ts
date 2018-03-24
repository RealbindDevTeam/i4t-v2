import { CollectionObject } from '../collection-object.model';

export interface Reward extends CollectionObject {
    item_id: string;
    item_quantity: number;
    points: number;
    establishments: string[];
    is_active: boolean;
}