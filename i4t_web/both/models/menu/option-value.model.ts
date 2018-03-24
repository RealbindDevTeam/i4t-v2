import { CollectionObject } from '../collection-object.model';

/**
 * Option value model
 */
export interface OptionValue extends CollectionObject{
    is_active: boolean;
    name: string;
    option_id: string;
}