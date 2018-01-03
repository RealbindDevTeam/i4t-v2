import { CollectionObject } from '../collection-object.model';

/**
 * Subcategory model
 */
export interface Subcategory extends CollectionObject{
    is_active: boolean;
    name: string;
    category: string;
}