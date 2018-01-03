import { Meteor } from 'meteor/meteor';
import { Accounts } from '../../collections/restaurant/account.collection';
import { Account } from '../../models/restaurant/account.model';
import { Orders } from '../../collections/restaurant/order.collection';
import { Payments } from '../../collections/restaurant/payment.collection';
import { Tables } from '../../collections/restaurant/table.collection';
import { Table } from '../../models/restaurant/table.model';
import { UserDetails } from "../../collections/auth/user-detail.collection";
import { WaiterCallDetail } from '../../models/restaurant/waiter-call-detail.model';
import { UserDetail } from 'both/models/auth/user-detail.model';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This method allow to payment of the account according to the restaurant and table
         * @param { string } _restaurantId
         * @param { string } _tableId
         */
        closePay: function (_restaurantId: string, _tableId: string, _call: WaiterCallDetail) {

            let _paymentsToPay: any;
            let _paymentsNotReceived: number = 0;
            let _countOrders: number = 0;
            let _userIds: string[] = [];

            _paymentsToPay = Payments.collection.find({ restaurantId: _restaurantId, tableId: _tableId, status: 'PAYMENT.NO_PAID', received: true });
            _paymentsNotReceived = Payments.collection.find({ restaurantId: _restaurantId, tableId: _tableId, status: 'PAYMENT.NO_PAID', received: false }).count();

            _paymentsToPay.fetch().forEach((pay) => {
                pay.orders.forEach((order) => {
                    Orders.update({ _id: order }, { $set: { status: 'ORDER_STATUS.CLOSED' } });
                });
                Payments.update({ _id: pay._id }, { $set: { status: 'PAYMENT.PAID' } });
                _userIds.push(pay.creation_user);

                let _lAccountTable: Account = Accounts.findOne({ tableId: _tableId, status: 'OPEN' });
                if (_lAccountTable) {
                    Accounts.update({ _id: _lAccountTable._id }, { $set: { total_payment: (_lAccountTable.total_payment - pay.totalOrdersPrice) } });
                }
                Meteor.call('invoiceGenerating', pay);
            });

            _userIds.forEach((user) => {
                let _orderOwner: number = 0;
                _orderOwner = Orders.collection.find({
                    creation_user: user, status:
                        { $in: ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM'] }
                }).count();
                if (_orderOwner === 0) {
                    let _userDetail: UserDetail = UserDetails.findOne({ user_id: user });
                    if (_userDetail) {
                        let _usersUpdated: number = UserDetails.collection.update({ _id: _userDetail._id }, { $set: { current_restaurant: '', current_table: '' } });
                        if (_usersUpdated > 0) {
                            let currentTable: Table = Tables.findOne({ _id: _tableId });
                            if (currentTable) {
                                Tables.update({ _id: _tableId }, { $set: { amount_people: (currentTable.amount_people - 1) } });
                            }
                        }
                    }
                }
            });

            _countOrders = Orders.collection.find({
                restaurantId: _restaurantId, tableId: _tableId, status:
                    { $in: ['ORDER_STATUS.REGISTERED', 'ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED', 'ORDER_STATUS.DELIVERED', 'ORDER_STATUS.PENDING_CONFIRM'] }
            }).count();

            let accountTable = Accounts.findOne({ tableId: _tableId, status: 'OPEN' });
            if (_countOrders === 0 && accountTable.total_payment === 0) {
                Accounts.update({ _id: accountTable._id }, { $set: { status: 'CLOSED' } });
                Tables.update({ _id: _tableId }, { $set: { status: 'FREE', amount_people: 0 } });
            }

            if (_paymentsNotReceived === 0) {
                Meteor.call('closeWaiterCall', _call);
            }
        }
    });
}