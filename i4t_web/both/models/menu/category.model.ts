import { CollectionObject } from '../collection-object.model';

/**
 * Category model
 */
export interface Category extends CollectionObject{
    is_active: boolean;
    name: string;
    section: string;
}