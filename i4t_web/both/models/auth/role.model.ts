import { CollectionObject } from '../collection-object.model';

export interface Role extends CollectionObject {
    is_active: boolean;
    name: string;
    description: string;
    menus: string[];
    user_prefix?: string;
}