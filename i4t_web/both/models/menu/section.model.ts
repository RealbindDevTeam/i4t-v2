import { CollectionObject } from '../collection-object.model';

/**
 * Section model
 */
export interface Section extends CollectionObject {
    establishments: string[];
    is_active: boolean;
    name: string;
}