import { InvoiceInfo } from '../../../../both/models/payment/invoice-info.model';
import { InvoicesInfo } from '../../../../both/collections/payment/invoices-info.collection';

export function loadInvoicesInfo() {
    if (InvoicesInfo.find().cursor.count() == 0) {
        const invoicesInfo: InvoiceInfo[] = [
            {
                _id: '100',
                country_id: '1900',
                resolution_one: '310000089509',
                prefix_one: 'I4T',
                start_date_one: new Date('2017-08-31T00:00:00.00Z'),
                end_date_one: new Date('2017-10-31T00:00:00.00Z'),
                start_value_one: 422000,
                end_value_one: 1000000,
                resolution_two: null,
                prefix_two: null,
                start_date_two: null,
                end_date_two: null,
                start_value_two: null,
                end_value_two: null,
                enable_two: false,
                current_value: null,
                start_new_value: true
            }
        ];

        invoicesInfo.forEach((invoiceInfo: InvoiceInfo) => InvoicesInfo.insert(invoiceInfo));
    }
}