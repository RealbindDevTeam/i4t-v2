import { CollectionObject } from '../collection-object.model';

/**
 * Iurest Invoice Model
 */
export interface IurestInvoice extends CollectionObject {
    payment_history_id?: string;
    country_id?: string;
    number?: string;
    generation_date?: Date;
    payment_method?: string;
    description?: string;
    period?: string;
    amount_no_iva?: string;
    subtotal?: string;
    iva?: string;
    total?: string
    currency?: string;
    company_info?: CompanyInfo;
    client_info?: ClientInfo;
    generated_computer_msg?: string;
}

/**
 * Company  Info Model
 */
export interface CompanyInfo {
    name?: string;
    address?: string;
    phone?: string;
    country?: string;
    city?: string;
    nit?: string
    regime?: string;
    contribution?: string;
    retainer?: string;
    agent_retainter?: string;
    resolution_number?: string;
    resolution_prefix?: string;
    resolution_start_date?: Date;
    resolution_end_date?: Date;
    resolution_start_value?: string;
    resolution_end_value?: string;
}

/**
 * Client Info Model
 */
export interface ClientInfo {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    identification?: string;
    phone?: string;
    email?: string;
}
