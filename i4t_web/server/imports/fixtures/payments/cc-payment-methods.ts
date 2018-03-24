import { CcPaymentMethod } from '../../../../both/models/payment/cc-payment-method.model';
import { CcPaymentMethods } from '../../../../both/collections/payment/cc-payment-methods.collection'

export function loadCcPaymentMethods() {
    if (CcPaymentMethods.find().cursor.count() == 0) {
        const ccPaymentMethods: CcPaymentMethod[] = [
            { _id: '10', is_active: true, name: 'Visa', payu_code: 'VISA', logo_name: 'visa' },
            { _id: '20', is_active: true, name: 'Mastercard', payu_code: 'MASTERCARD', logo_name: 'mastercard' },
            { _id: '30', is_active: true, name: 'American Express', payu_code: 'AMEX', logo_name: 'amex' },
            { _id: '40', is_active: true, name: 'Diners Club', payu_code: 'DINERS', logo_name: 'diners' }
        ];
        ccPaymentMethods.forEach((ccPaymentMethod: CcPaymentMethod) => { CcPaymentMethods.insert(ccPaymentMethod) });
    }
}