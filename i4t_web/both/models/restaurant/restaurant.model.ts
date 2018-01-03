import { CollectionObject } from '../collection-object.model';

/**
 * Restaurant model
 */
export interface Restaurant extends CollectionObject {
    countryId: string;
    cityId?: string;
    other_city?: string;
    name: string;
    currencyId: string;
    address: string;
    indicative: string;
    phone: string;
    restaurant_code: string;
    paymentMethods: string[];
    tip_percentage: number;
    tables_quantity: number;
    image?: RestaurantImage;
    orderNumberCount: number;
    max_jobs?: number;
    queue: string[];
    isActive: boolean;
    firstPay: boolean;
    freeDays?: boolean;
    is_premium?: boolean;
}

/**
 * RestaurantImage model
 */
export interface RestaurantImage {
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
 * RestaurantLocation model
 */
export interface RestaurantLocation {
    lat: number;
    lng: number;
}

/**
 * RestaurantSchedule model
 */
export interface RestaurantSchedule {
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
 * RestaurantTurn model
 */
export interface RestaurantTurn extends CollectionObject {
    restaurant_id: string,
    turn: number,
    last_waiter_id: string,
}

/**
 * RestaurantSocialNetwork Model
 */
export interface RestaurantSocialNetwork {
    facebook?: string;
    twitter?: string;
    instagram?: string;
}

/**
 * Restaurant legality model
 */
export interface RestaurantLegality {
    _id?: string;
    restaurant_id: string;
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
    //second resolution info
    invoice_resolution2?: string;
    invoice_resolution_date2?: Date;
    prefix2?: boolean;
    prefix_name2?: string;
    numeration_from2?: number;
    numeration_to2?: number;
    //validation flags
    enable_two?: boolean;
    current_value?: number;
    start_new_value?: boolean;
    is_retaining_agent?: boolean;
}

/**
 * Restaurant Profile Model
 */
export interface RestaurantProfile extends CollectionObject {
    _id?: string;
    restaurant_id: string;
    restaurant_description: string;
    web_page?: string;
    email?: string;
    social_networks?: RestaurantSocialNetwork;
    images?:RestaurantProfileImage[];
    schedule: RestaurantSchedule;
    location: RestaurantLocation;
}

/**
 * RestaurantProfileImage model
 */
export interface RestaurantProfileImage {
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