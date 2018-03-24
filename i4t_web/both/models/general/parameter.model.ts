import { CollectionObject } from '../collection-object.model';
/**
 * Parameter model
 */
export interface Parameter extends CollectionObject{
    name: string;
    value: string;
    description: string;
}