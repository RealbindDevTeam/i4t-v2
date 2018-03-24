import { Meteor } from 'meteor/meteor';
import { PaymentsHistory } from '../../collections/payment/payment-history.collection';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Countries } from '../../collections/general/country.collection';
import { Cities } from '../../collections/general/city.collection';
import { InvoicesInfo } from '../../collections/payment/invoices-info.collection';
import { IurestInvoices } from '../../collections/payment/iurest-invoices.collection';
import { Parameters } from '../../collections/general/parameter.collection';
import { CompanyInfo, ClientInfo } from '../../models/payment/iurest-invoice.model';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This function allow generate iurest invoice for admin establishment
         * @param { string } _paymentHistoryId
         * @param { string } _userId 
         */
        generateInvoiceInfo: function (_paymentHistoryId: string, _userId: string) {

            let _currentDate: Date = new Date();
            let _firstMonthDay: Date = new Date(_currentDate.getFullYear(), _currentDate.getMonth(), 1);
            let _lastMonthDay: Date = new Date(_currentDate.getFullYear(), _currentDate.getMonth() + 1, 0);

            let lUserDetail = UserDetails.findOne({ user_id: _userId });
            let lCountry = Countries.findOne({ _id: lUserDetail.country_id });
            let lCity = Cities.findOne({ _id: lUserDetail.city_id });
            let lPaymentHistory = PaymentsHistory.findOne({ _id: _paymentHistoryId });
            let invoiceInfo = InvoicesInfo.findOne({ country_id: lCountry._id });

            let var_resolution: string;
            let var_prefix: string;
            let var_start_value: number;
            let var_current_value: number;
            let var_end_value: number;
            let var_start_date: Date;
            let var_end_date: Date;
            let var_enable_two: boolean;
            let var_start_new: boolean;

            let company_name = Parameters.findOne({ name: 'company_name' }).value;
            let company_address = Parameters.findOne({ name: 'company_address' }).value;
            let company_phone = Parameters.findOne({ name: 'company_phone' }).value;
            let company_country = Parameters.findOne({ name: 'company_country' }).value;
            let company_city = Parameters.findOne({ name: 'company_city' }).value;
            let company_nit = Parameters.findOne({ name: 'company_nit' }).value;
            let company_regime = Parameters.findOne({ name: 'company_regime' }).value;
            let company_contribution = Parameters.findOne({ name: 'company_contribution' }).value;
            let company_retainer = Parameters.findOne({ name: 'company_retainer' }).value;
            let company_agent_retainer = Parameters.findOne({ name: 'company_agent_retainer' }).value;
            let invoice_generated_msg = Parameters.findOne({ name: 'invoice_generated_msg' }).value;

            //Generate consecutive
            if (invoiceInfo.enable_two == false) {
                if (invoiceInfo.start_new_value == true) {
                    var_current_value = invoiceInfo.start_value_one;
                    var_enable_two = false;
                    var_start_new = false;
                } else {
                    var_current_value = invoiceInfo.current_value + 1;
                    if (var_current_value == invoiceInfo.end_value_one) {
                        var_enable_two = true;
                        var_start_new = true;
                    } else {
                        var_enable_two = false;
                        var_start_new = false;
                    }
                }
                var_resolution = invoiceInfo.resolution_one;
                var_prefix = invoiceInfo.prefix_one;
                var_start_value = invoiceInfo.start_value_one;
                var_end_value = invoiceInfo.end_value_one;
                var_start_date = invoiceInfo.start_date_one;
                var_end_date = invoiceInfo.end_date_one;
            } else {
                if (invoiceInfo.start_new_value == true) {
                    var_current_value = invoiceInfo.start_value_two;
                    var_enable_two = true;
                    var_start_new = false;
                } else {
                    var_current_value = invoiceInfo.current_value + 1;
                    if (var_current_value == invoiceInfo.end_value_two) {
                        var_enable_two = false;
                        var_start_new = true;
                    } else {
                        var_enable_two = true;
                        var_start_new = false;
                    }
                }
                var_resolution = invoiceInfo.resolution_two;
                var_prefix = invoiceInfo.prefix_two;
                var_start_value = invoiceInfo.start_value_two;
                var_end_value = invoiceInfo.end_value_two;
                var_start_date = invoiceInfo.start_date_two;
                var_end_date = invoiceInfo.end_date_two;
            }

            InvoicesInfo.collection.update({ _id: invoiceInfo._id },
                {
                    $set: {
                        current_value: var_current_value,
                        enable_two: var_enable_two,
                        start_new_value: var_start_new
                    }
                });

            let company_info: CompanyInfo = {
                name: company_name,
                address: company_address,
                phone: company_phone,
                country: company_country,
                city: company_city,
                nit: company_nit,
                regime: company_regime,
                contribution: company_contribution,
                retainer: company_retainer,
                agent_retainter: company_agent_retainer,
                resolution_number: var_resolution,
                resolution_prefix: var_prefix,
                resolution_start_date: var_start_date,
                resolution_end_date: var_end_date,
                resolution_start_value: var_start_value.toString(),
                resolution_end_value: var_end_value.toString()
            };

            let auxCity = lUserDetail.city_id === '' || lUserDetail.city_id === null || lUserDetail.city_id === undefined ? lUserDetail.other_city : lCity.name;

            let client_info: ClientInfo = {
                name: Meteor.user().profile.first_name + ' ' + Meteor.user().profile.last_name,
                address: lUserDetail.address,
                city: auxCity,
                country: lCountry.name,
                identification: lUserDetail.dni_number,
                phone: lUserDetail.contact_phone,
                email: Meteor.user().emails[0].address
            };

            IurestInvoices.collection.insert({
                creation_user: Meteor.userId(),
                creation_date: new Date(),
                payment_history_id: lPaymentHistory._id,
                country_id: lCountry._id,
                number: var_current_value.toString(),
                generation_date: new Date(),
                payment_method: 'RES_PAYMENT_HISTORY.CC_PAYMENT_METHOD',
                description: 'RES_PAYMENT_HISTORY.DESCRIPTION',
                period: _firstMonthDay.getDate() + '/' + (_firstMonthDay.getMonth() + 1) + '/' + _firstMonthDay.getFullYear() +
                    ' - ' + _lastMonthDay.getDate() + '/' + (_lastMonthDay.getMonth() + 1) + '/' + _lastMonthDay.getFullYear(),
                amount_no_iva: Meteor.call('getReturnBase', lPaymentHistory.paymentValue).toString(),
                subtotal: "0",
                iva: "0",
                total: lPaymentHistory.paymentValue.toString(),
                currency: lPaymentHistory.currency,
                company_info: company_info,
                client_info: client_info,
                generated_computer_msg: invoice_generated_msg
            });
        },
        /**
        * This function gets the tax value according to the value
        * @param {number} _paymentValue
        */
        getValueTax: function (_paymentValue: number): number {
            let parameterTax = Parameters.findOne({ name: 'colombia_tax_iva' });
            let percentValue = Number(parameterTax.value);
            return (_paymentValue * percentValue) / 100;
        },
        /**
        * This function gets the tax value according to the value
        * @param {number} _paymentValue
        */
        getReturnBase: function (_paymentValue: number): number {
            let amountPercent: number = Meteor.call('getValueTax', _paymentValue);
            return _paymentValue - amountPercent;
        }
    });
}