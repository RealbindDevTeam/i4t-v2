import { CollectionObject } from '../collection-object.model';

/**
 * Option model
 */
export interface Option extends CollectionObject {
    establishments: string[];
    is_active: boolean;
    name: string;
}