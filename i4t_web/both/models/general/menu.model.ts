import { CollectionObject } from '../collection-object.model';

export interface Menu extends CollectionObject {
    is_active: boolean;
    name: string;
    description: string;
    icon_name?: string;
}