import { CollectionObject } from '../collection-object.model';

/**
 * Item model
 */
export interface Item extends CollectionObject {
    is_active: boolean;
    sectionId: string;
    categoryId?: string;
    subcategoryId?: string;
    name: string;
    description: string;
    time: string;
    establishments: ItemEstablishment[];
    prices: ItemPrice[];
    observations: boolean;
    image?: ItemImage;
    options: ItemOption[];
    additions: string[];
    has_reward?: boolean;
    reward_points?: string;
}

/**
 * Item Images model
 */
export interface ItemImage {
    _id?: string;
    filename: string;
    handle: string;
    mimetype: string;
    originalPath: string;
    size: string;
    source: string;
    url: string;
    originalFile?: Object;
    status?: string;
    key?: string;
    container?: string;
    uploadId: string;
}

/**
 * Item Establishment model
 */
export interface ItemEstablishment {
    establishment_id: string;
    price: number;
    itemTax?: number;
    isAvailable: boolean;
    recommended?: boolean;
    aply_reward?: boolean;
}

/**
 * Item Price model
 */
export interface ItemPrice {
    currencyId: string;
    price: number;
    itemTax?: number;
}

/**
 * Item Option model
 */
export interface ItemOption {
    option_id: string;
    is_required: boolean;
    values: ItemOptionValue[];
}

/**
 * Item Option Value model
 */
export interface ItemOptionValue {
    option_value_id: string;
    have_price: boolean;
    price?: number;
}