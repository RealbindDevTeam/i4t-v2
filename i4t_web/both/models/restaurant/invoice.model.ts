import { CollectionObject } from '../collection-object.model';

/**
 * Invoice Model
 */
export interface Invoice extends CollectionObject {
    restaurant_id: string;
    payment_id: string;
    restaurant_name: string;
    restaurant_address: string;
    restaurant_phone: string;
    country_id: string;
    table_number: number;
    total_pay: number;
    total_order: number;
    total_tip: number;
    customer_id: string;
    currency: string;
    pay_method: string;
    items?: InvoiceItem[];
    additions?: InvoiceAddition[];
    legal_information: InvoiceLegalInformation;
}

/**
 * Invoice Item Model
 */
export interface InvoiceItem {
    item_name: string;
    quantity: number;
    garnish_food: InvoiceItemGarnish[];
    additions: InvoiceItemAddition[];
    price: number;
}

/**
 * Invoice Addition Model
 */
export interface InvoiceAddition {
    addition_name: string;
    quantity: number;
    price: number;
}


/**
 * Item addition Model
 */
export interface InvoiceItemAddition {
    addition_name: string,
    price: number
}

/**
 * Item garnish Model
 */
export interface InvoiceItemGarnish {
    garnish_food_name: string,
    price: number
}

/**
 * InvoiceLegalInformation Model
 */
export interface InvoiceLegalInformation {
    // Colombia
    regime?: string;
    forced_to_invoice?: boolean;
    forced_to_inc?: boolean;
    business_name?: string;
    document?: string;
    invoice_resolution?: string;
    invoice_resolution_date?: Date;
    prefix?: boolean;
    prefix_name?: string;
    numeration_from?: number;
    numeration_to?: number;
    is_big_contributor?: boolean;
    big_contributor_resolution?: string;
    big_contributor_date?: Date;
    is_self_accepting?: boolean;
    self_accepting_resolution?: string;
    self_accepting_date?: Date;
    text_at_the_end?: string;
    number?: string;
    is_retaining_agent?: boolean;
}