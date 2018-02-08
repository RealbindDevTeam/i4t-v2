/**
 * City Model
 */
export interface City {
    _id?: string;
    is_active: boolean;
    name: string;
    country?: string;
}