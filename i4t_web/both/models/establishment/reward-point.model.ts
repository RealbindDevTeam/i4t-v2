/**
 * RewardPoint Model
 */
export interface RewardPoint {
    _id?: string;
    id_user: string;
    establishment_id: string;
    points: number;
    days_to_expire: number;
    gain_date: Date;
    expire_date: Date;
    is_active: boolean;
    difference?: number;
}