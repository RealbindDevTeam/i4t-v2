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
    establishment_price: number;
    tablePrice: number;
    cronValidateActive: string;
    cronChangeFreeDays?: string;
    cronEmailChargeSoon: string;
    cronEmailExpireSoon: string;
    cronEmailRestExpired: string;
    max_number_tables?: number;
    cronPointsExpire: string
}