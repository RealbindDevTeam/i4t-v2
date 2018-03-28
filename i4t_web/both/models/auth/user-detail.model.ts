import { CollectionObject } from '../collection-object.model';

export interface UserDetail extends CollectionObject {
    user_id: string;
    role_id: string;
    is_active: boolean;

    //fields for admin register
    contact_phone?: string;
    dni_number?: string;
    address?: string;
    country_id?: string;
    city_id?: string;
    other_city?: string;
    show_after_rest_creation?: boolean;
    //

    establishment_work?: string;
    jobs?: number;
    penalties?: UserDetailPenalty[];
    grant_start_points?: boolean;
    current_establishment?: string;
    current_table?: string;
    birthdate?: Date;
    phone?: string;
    enabled?: boolean;
    table_assignment_init?: number;
    table_assignment_end?: number;
    image?: UserDetailImage;
    reward_points?: UserRewardPoints[];
}

export interface UserDetailPenalty {
    establishment_id: string;
    date: Date;
}

/**
 * User Detail Image Model
 */
export class UserDetailImage {
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

export interface UserRewardPoints {
    index: number;
    establishment_id: string;
    points: number;
}