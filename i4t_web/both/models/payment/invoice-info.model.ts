/**
 * Invoice of iurest services clients Model
 */
export interface InvoiceInfo {
    _id?: string;
    country_id?: string;
    resolution_one?: string;
    prefix_one?: string;
    start_date_one?: Date;
    end_date_one?: Date;
    start_value_one?: number;
    end_value_one?: number;
    resolution_two?: string;
    prefix_two?: string;
    start_date_two?: Date;
    end_date_two?: Date;
    start_value_two?: number;
    end_value_two?: number;
    enable_two?: boolean;
    current_value?: number;
    start_new_value?: boolean;
}