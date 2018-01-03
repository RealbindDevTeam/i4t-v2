import { CollectionObject } from '../collection-object.model';

/**
 * Table model
 */
export interface Table extends CollectionObject {
    is_active:boolean;    
    restaurantId: string;
    table_code:string;
    QR_code:string;
    QR_information:QRCodeInformation;
    amount_people:number;
    status:string;
    QR_URI: string;
    _number: number;    
}

/**
 * Bytes Info model
 */
export interface BytesInfo {
    finalByte:number;
    originalByte:number;    
    bits:string;
}

/**
 * QRCodeInformation model
 */
export interface QRCodeInformation {
    significativeBits:number;
    bytes:BytesInfo[];    
}