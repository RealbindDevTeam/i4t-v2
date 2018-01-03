import { CollectionObject } from '../collection-object.model';

export interface CcPaymentMethod extends CollectionObject {
    is_active: boolean;
    name: string;
    payu_code: string;
    logo_name: string;
}