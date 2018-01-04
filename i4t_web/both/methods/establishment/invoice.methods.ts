import { Meteor } from 'meteor/meteor';
import { Invoice, InvoiceItem, InvoiceAddition, InvoiceLegalInformation } from '../../models/establishment/invoice.model';
import { Invoices } from '../../collections/establishment/invoice.collection';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Tables } from '../../collections/establishment/table.collection';
import { Orders } from '../../collections/establishment/order.collection';
import { Items } from '../../collections/menu/item.collection';
import { GarnishFoodCol } from '../../collections/menu/garnish-food.collection';
import { Additions } from '../../collections/menu/addition.collection';
import { Currencies } from "../../collections/general/currency.collection";
import { PaymentMethods } from "../../collections/general/paymentMethod.collection";

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This function allow Invoice generate
         * @param { string } _restaurantId
         
        invoiceGenerating: function (_pPay: any) {
            let lRestaurant = Restaurants.findOne({ _id: _pPay.restaurantId });
            let lTable = Tables.findOne({ _id: _pPay.tableId });
            let lCurrency = Currencies.findOne({ _id: lRestaurant.currencyId });
            let lPayMethod = PaymentMethods.findOne({ _id: _pPay.paymentMethodId });
            let lRestaurantLegality = RestaurantsLegality.findOne({ restaurant_id: lRestaurant._id });

            let lInvoiceItems: InvoiceItem[] = [];
            let lInvoiceAdditions: InvoiceAddition[] = [];
            let lInvoiceLegalInformation: InvoiceLegalInformation = {};

            _pPay.orders.forEach((order) => {
                let lOrder = Orders.findOne({ _id: order });

                lOrder.items.forEach((item) => {
                    let lItem = Items.findOne({ _id: item.itemId });
                    let lGarnishFood: any[] = [];
                    let lAdditions: any[] = [];

                    if (item.garnishFood.length > 0) {
                        item.garnishFood.forEach((gf) => {
                            let lgf = GarnishFoodCol.findOne({ _id: gf });
                            lGarnishFood.push({
                                garnish_food_name: lgf.name,
                                price: lgf.restaurants.filter(g => g.restaurantId === _pPay.restaurantId)[0].price
                            });
                        });
                    }
                    if (item.additions.length > 0) {
                        item.additions.forEach((ad) => {
                            let lad = Additions.findOne({ _id: ad });
                            lAdditions.push({
                                addition_name: lad.name,
                                price: lad.restaurants.filter(a => a.restaurantId === _pPay.restaurantId)[0].price
                            });
                        });
                    }
                    let lInvoiceItem: InvoiceItem = {
                        item_name: lItem.name,
                        quantity: item.quantity,
                        garnish_food: lGarnishFood,
                        additions: lAdditions,
                        price: lItem.restaurants.filter(i => i.restaurantId === _pPay.restaurantId)[0].price,
                    }
                    lInvoiceItems.push(lInvoiceItem);
                });

                lOrder.additions.forEach((addition) => {
                    let lAddition = Additions.findOne({ _id: addition.additionId });
                    let lAddAddition: InvoiceAddition = {
                        addition_name: lAddition.name,
                        quantity: addition.quantity,
                        price: lAddition.restaurants.filter(a => a.restaurantId === _pPay.restaurantId)[0].price,
                    }
                    lInvoiceAdditions.push(lAddAddition);
                });
            });


            let var_resolution: string;
            let var_prefix: boolean;
            let var_prefix_name: string;
            let var_start_value: number;
            let var_current_value: number;
            let var_end_value: number;
            let var_start_date: Date;
            let var_end_date: Date;
            let var_enable_two: boolean;
            let var_start_new: boolean;

            // Colombia Invoice
            if (lRestaurant.countryId === '1900') {
                //

                if (lRestaurantLegality.enable_two == false) {
                    if (lRestaurantLegality.start_new_value == true) {
                        var_current_value = lRestaurantLegality.numeration_from;
                        var_enable_two = false;
                        var_start_new = false;
                    } else {
                        var_current_value = lRestaurantLegality.current_value + 1;
                        if (var_current_value == lRestaurantLegality.numeration_to) {
                            var_enable_two = true;
                            var_start_new = true;
                        } else {
                            var_enable_two = false;
                            var_start_new = false;
                        }
                    }
                    var_resolution = lRestaurantLegality.invoice_resolution;
                    if (lRestaurantLegality.prefix) {
                        var_prefix_name = lRestaurantLegality.prefix_name;
                    }
                    var_prefix = lRestaurantLegality.prefix;
                    var_start_value = lRestaurantLegality.numeration_from;
                    var_end_value = lRestaurantLegality.numeration_to;
                    var_start_date = lRestaurantLegality.invoice_resolution_date;

                } else {
                    if (lRestaurantLegality.start_new_value == true) {
                        var_current_value = lRestaurantLegality.numeration_from2;
                        var_enable_two = true;
                        var_start_new = false;
                    } else {
                        var_current_value = lRestaurantLegality.current_value + 1;
                        if (var_current_value == lRestaurantLegality.numeration_to2) {
                            var_enable_two = false;
                            var_start_new = true;
                        } else {
                            var_enable_two = true;
                            var_start_new = false;
                        }
                    }

                    var_resolution = lRestaurantLegality.invoice_resolution2;
                    if (lRestaurantLegality.prefix2) {
                        var_prefix_name = lRestaurantLegality.prefix_name2;
                    }
                    var_prefix = lRestaurantLegality.prefix2;
                    var_start_value = lRestaurantLegality.numeration_from2;
                    var_end_value = lRestaurantLegality.numeration_to2;
                    var_start_date = lRestaurantLegality.invoice_resolution_date2;
                }

                lInvoiceLegalInformation.regime = lRestaurantLegality.regime;
                lInvoiceLegalInformation.forced_to_invoice = lRestaurantLegality.forced_to_invoice;
                lInvoiceLegalInformation.forced_to_inc = lRestaurantLegality.forced_to_inc;
                if (lInvoiceLegalInformation.regime === 'regime_co') {
                    lInvoiceLegalInformation.business_name = lRestaurantLegality.business_name;
                    lInvoiceLegalInformation.document = lRestaurantLegality.document;
                    lInvoiceLegalInformation.invoice_resolution = var_resolution;
                    lInvoiceLegalInformation.invoice_resolution_date = var_start_date;
                    lInvoiceLegalInformation.prefix = var_prefix;
                    if (var_prefix) {
                        lInvoiceLegalInformation.prefix_name = var_prefix_name;
                    }
                    lInvoiceLegalInformation.numeration_from = var_start_value;
                    lInvoiceLegalInformation.numeration_to = var_end_value;
                    lInvoiceLegalInformation.is_big_contributor = lRestaurantLegality.is_big_contributor;
                    if (lInvoiceLegalInformation.is_big_contributor) {
                        lInvoiceLegalInformation.big_contributor_resolution = lRestaurantLegality.big_contributor_resolution;
                        lInvoiceLegalInformation.big_contributor_date = lRestaurantLegality.big_contributor_date;
                    }
                    lInvoiceLegalInformation.is_self_accepting = lRestaurantLegality.is_self_accepting;
                    if (lInvoiceLegalInformation.is_self_accepting) {
                        lInvoiceLegalInformation.self_accepting_resolution = lRestaurantLegality.self_accepting_resolution;
                        lInvoiceLegalInformation.self_accepting_date = lRestaurantLegality.self_accepting_date;
                    }
                    lInvoiceLegalInformation.is_retaining_agent = lRestaurantLegality.is_retaining_agent;
                    lInvoiceLegalInformation.text_at_the_end = lRestaurantLegality.text_at_the_end;
                    lInvoiceLegalInformation.number = var_current_value.toString();
                } else if (lInvoiceLegalInformation.regime === 'regime_si') {
                    if (lInvoiceLegalInformation.forced_to_invoice) {
                        lInvoiceLegalInformation.business_name = lRestaurantLegality.business_name;
                        lInvoiceLegalInformation.document = lRestaurantLegality.document;
                        lInvoiceLegalInformation.invoice_resolution = var_resolution;
                        lInvoiceLegalInformation.invoice_resolution_date = var_start_date;
                        lInvoiceLegalInformation.prefix = var_prefix;
                        if (var_prefix) {
                            lInvoiceLegalInformation.prefix_name = var_prefix_name;
                        }
                        lInvoiceLegalInformation.numeration_from = var_start_value;
                        lInvoiceLegalInformation.numeration_to = var_end_value;
                        lInvoiceLegalInformation.text_at_the_end = lRestaurantLegality.text_at_the_end;
                        lInvoiceLegalInformation.number = var_current_value.toString();
                    }
                }
            }

            RestaurantsLegality.update({ _id: lRestaurantLegality._id },
                {
                    $set: {
                        current_value: var_current_value,
                        enable_two: var_enable_two,
                        start_new_value: var_start_new
                    }
                });

            Invoices.insert({
                creation_user: Meteor.userId(),
                creation_date: new Date(),
                restaurant_id: _pPay.restaurantId,
                payment_id: _pPay._id,
                restaurant_name: lRestaurant.name,
                restaurant_address: lRestaurant.address,
                restaurant_phone: lRestaurant.phone,
                country_id: lRestaurant.countryId,
                table_number: lTable._number,
                total_pay: _pPay.totalToPayment,
                total_order: _pPay.totalOrdersPrice,
                total_tip: _pPay.totalTip,
                customer_id: _pPay.userId,
                currency: lCurrency.code,
                pay_method: lPayMethod.name,
                items: lInvoiceItems,
                additions: lInvoiceAdditions,
                legal_information: lInvoiceLegalInformation
            });
        }*/
    });
}