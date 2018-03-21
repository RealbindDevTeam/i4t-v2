import { CollectionObject } from '../collection-object.model';

/**
 * Establishment model
 */
export interface Establishment extends CollectionObject {
    countryId: string;
    cityId?: string;
    other_city?: string;
    name: string;
    currencyId: string;
    address: string;
    indicative: string;
    phone: string;
    establishment_code: string;
    paymentMethods: string[];
    points_validity: string;
    tables_quantity: number;
    image?: EstablishmentImage;
    orderNumberCount: number;
    max_jobs?: number;
    queue: string[];
    isActive: boolean;
    firstPay: boolean;
    freeDays?: boolean;
    is_premium?: boolean;
    is_beta_tester: boolean;
    bag_plans_id: string;
    is_freemium: boolean;
}

/**
 * EstablishmentImage model
 */
export interface EstablishmentImage {
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
 * EstablishmentLocation model
 */
export interface EstablishmentLocation {
    lat: number;
    lng: number;
}

/**
 * EstablishmentSchedule model
 */
export interface EstablishmentSchedule {
    monday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    tuesday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    wednesday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    thursday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    friday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    saturday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    sunday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    },
    holiday?: {
        isActive: boolean,
        opening_time: string,
        closing_time: string
    }
};

/**
 * EstablishmentTurn model
 */
export interface EstablishmentTurn extends CollectionObject {
    establishment_id: string,
    turn: number,
    last_waiter_id: string,
}

/**
 * EstablishmentSocialNetwork Model
 */
export interface EstablishmentSocialNetwork {
    facebook?: string;
    twitter?: string;
    instagram?: string;
}

/**
 * Establishment Profile Model
 */
export interface EstablishmentProfile extends CollectionObject {
    _id?: string;
    establishment_id: string;
    establishment_description: string;
    web_page?: string;
    email?: string;
    social_networks?: EstablishmentSocialNetwork;
    images?:EstablishmentProfileImage[];
    schedule: EstablishmentSchedule;
    location: EstablishmentLocation;
    types_of_food?: string[];
}

/**
 * EstablishmentProfileImage model
 */
export interface EstablishmentProfileImage {
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