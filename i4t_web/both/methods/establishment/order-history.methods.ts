import { Meteor } from 'meteor/meteor';
import { OrderHistory, OrderHistoryItem, OrderHistoryAddition } from '../../models/establishment/order-history.model';
import { OrderHistories } from '../../collections/establishment/order-history.collection';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Tables } from '../../collections/establishment/table.collection';
import { Order } from '../../models/establishment/order.model';
import { Orders } from '../../collections/establishment/order.collection';
import { Items } from '../../collections/menu/item.collection';
import { GarnishFoodCol } from '../../collections/menu/garnish-food.collection';
import { Additions } from '../../collections/menu/addition.collection';
import { Currencies } from "../../collections/general/currency.collection";

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This function allow generate order history
         * @param { Order } _pOrder
         */
        generateOrderHistory: function (_pOrder: Order, _pWaiterId:string) {
            let lEstablishment = Establishments.findOne({ _id: _pOrder.establishment_id });
            let lTable = Tables.findOne({ _id: _pOrder.tableId });
            let lCurrency = Currencies.findOne({ _id: lEstablishment.currencyId });

            let lInvoiceItems: OrderHistoryItem[] = [];
            let lInvoiceAdditions: OrderHistoryAddition[] = [];

            _pOrder.items.forEach((item) => {
                let lItem = Items.findOne({ _id: item.itemId });
                let lGarnishFood: any[] = [];
                let lAdditions: any[] = [];

                if (item.garnishFood.length > 0) {
                    item.garnishFood.forEach((gf) => {
                        let lgf = GarnishFoodCol.findOne({ _id: gf });
                        lGarnishFood.push({
                            garnish_food_name: lgf.name,
                            price: lgf.establishments.filter(g => g.establishment_id === _pOrder.establishment_id)[0].price
                        });
                    });
                }
                if (item.additions.length > 0) {
                    item.additions.forEach((ad) => {
                        let lad = Additions.findOne({ _id: ad });
                        lAdditions.push({
                            addition_name: lad.name,
                            price: lad.establishments.filter(a => a.establishment_id === _pOrder.establishment_id)[0].price
                        });
                    });
                }
                let lInvoiceItem: OrderHistoryItem;
                if (item.is_reward) {
                    lInvoiceItem = {
                        item_name: lItem.name,
                        quantity: item.quantity,
                        garnish_food: lGarnishFood,
                        additions: lAdditions,
                        price: lItem.establishments.filter(i => i.establishment_id === _pOrder.establishment_id)[0].price,
                        is_reward: item.is_reward,
                        redeemed_points: item.redeemed_points
                    }
                } else {
                    lInvoiceItem = {
                        item_name: lItem.name,
                        quantity: item.quantity,
                        garnish_food: lGarnishFood,
                        additions: lAdditions,
                        price: lItem.establishments.filter(i => i.establishment_id === _pOrder.establishment_id)[0].price,
                        is_reward: item.is_reward
                    }
                }
                lInvoiceItems.push(lInvoiceItem);
            });

            _pOrder.additions.forEach((addition) => {
                let lAddition = Additions.findOne({ _id: addition.additionId });
                let lAddAddition: OrderHistoryAddition = {
                    addition_name: lAddition.name,
                    quantity: addition.quantity,
                    price: lAddition.establishments.filter(a => a.establishment_id === _pOrder.establishment_id)[0].price,
                }
                lInvoiceAdditions.push(lAddAddition);
            });

            if (_pOrder.total_reward_points) {
                OrderHistories.insert({
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: _pOrder.establishment_id,
                    establishment_name: lEstablishment.name,
                    establishment_address: lEstablishment.address,
                    establishment_phone: lEstablishment.phone,
                    country_id: lEstablishment.countryId,
                    order_code: _pOrder.code,
                    table_number: lTable._number,
                    total_order: _pOrder.totalPayment,
                    customer_id: _pOrder.creation_user,
                    currency: lCurrency.code,
                    items: lInvoiceItems,
                    additions: lInvoiceAdditions,
                    total_reward_points: _pOrder.total_reward_points
                });
            } else {
                OrderHistories.insert({
                    creation_user: _pWaiterId,
                    creation_date: new Date(),
                    establishment_id: _pOrder.establishment_id,
                    establishment_name: lEstablishment.name,
                    establishment_address: lEstablishment.address,
                    establishment_phone: lEstablishment.phone,
                    country_id: lEstablishment.countryId,
                    order_code: _pOrder.code,
                    table_number: lTable._number,
                    total_order: _pOrder.totalPayment,
                    customer_id: _pOrder.creation_user,
                    currency: lCurrency.code,
                    items: lInvoiceItems,
                    additions: lInvoiceAdditions
                });
            }
        }
    });
}