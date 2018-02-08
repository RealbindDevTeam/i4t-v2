import { CollectionObject } from '../collection-object.model';

/**
 * EmailContent Model
 */
export interface EmailContent extends CollectionObject{
    language: string;
    lang_dictionary: LangDictionary[];
}

export interface LangDictionary {
    label: string;
    traduction: string;
}