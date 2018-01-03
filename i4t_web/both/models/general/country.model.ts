/**
 * Country Model
 */
export interface Country {
    _id?: string;
    is_active: boolean;
    name: string;
    alfaCode2: string;
    alfaCode3: string;
    numericCode: string;
    indicative: string;
    currencyId: string;
    itemsWithDifferentTax: boolean;
    queue: string[];
    restaurantPrice: number;
    tablePrice: number;
    cronValidateActive: string;
    cronChangeFreeDays?: string;
    cronEmailChargeSoon: string;
    cronEmailExpireSoon: string;
    cronEmailRestExpired: string;
    max_number_tables?: number;
}