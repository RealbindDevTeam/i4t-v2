/**
 * Currency model
 */
export interface Currency {
    _id?: string;
    isActive: boolean;
    name: string;
    code: string;
    numericCode: string;
    decimal: number;
}