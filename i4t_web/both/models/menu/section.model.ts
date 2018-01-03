import { CollectionObject } from '../collection-object.model';

/**
 * Section model
 */
export interface Section extends CollectionObject {
    restaurants: string[];
    is_active: boolean;
    name: string;
}