import { CollectionObject } from '../collection-object.model';

export interface Language extends CollectionObject {
    is_active: boolean;
    language_code: string;
    name: string;
    image?: string;
}