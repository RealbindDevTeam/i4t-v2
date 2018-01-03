import { PaymentMethod } from '../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../both/collections/general/paymentMethod.collection';

export function loadPaymentMethods(){
    if( PaymentMethods.find().cursor.count() === 0 ){
        const payments: PaymentMethod[] = [
            { _id: "10", isActive: true, name: 'PAYMENT_METHODS.CASH' },
            { _id: "20", isActive: true, name: 'PAYMENT_METHODS.CREDIT_CARD' },
            { _id: "30", isActive: true, name: 'PAYMENT_METHODS.DEBIT_CARD' },
            { _id: "40", isActive: false, name: 'PAYMENT_METHODS.ONLINE' },
        ];
        payments.forEach( ( pay:PaymentMethod ) => PaymentMethods.insert( pay ) );
    }
}