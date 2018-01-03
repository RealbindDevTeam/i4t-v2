import { Meteor } from 'meteor/meteor';
import { CodeGenerator } from './QR/codeGenerator';
import { Table } from '../../models/restaurant/table.model';
import { Tables } from '../../collections/restaurant/table.collection';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Account } from '../../models/restaurant/account.model';
import { Accounts } from '../../collections/restaurant/account.collection';
import { Restaurant } from '../../models/restaurant/restaurant.model';
import { Restaurants } from '../../collections/restaurant/restaurant.collection';
import { Order } from '../../models/restaurant/order.model';
import { Orders } from '../../collections/restaurant/order.collection';
import { WaiterCallDetail } from '../../models/restaurant/waiter-call-detail.model';
import { WaiterCallDetails } from '../../collections/restaurant/waiter-call-detail.collection';
import { UserDetail } from '../../models/auth/user-detail.model';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';
import { UserPenalty } from '../../models/auth/user-penalty.model';
import { UserPenalties } from '../../collections/auth/user-penalty.collection';

/**
 * This function create random code with 9 length to restaurants
 */
export function createRestaurantCode(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 9; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create random code with 5 length to restaurants
 */
export function createTableCode(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 5; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create QR Codes to restaurants
 * @param {string} _pRestaurantId
 * @param {string} _pTableCode
 * @param {string} _pStringToCode
 * @return {Table} generateQRCode
 */
export function generateQRCode(_pStringToCode: string): any {
    let _lCodeGenerator = new CodeGenerator(_pStringToCode);
    _lCodeGenerator.generateCode();
    return _lCodeGenerator;
}

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This Meteor Method return restaurant object with QR Code condition
         * @param {string} _qrcode
         * @param {string} _userId
         */
        getRestaurantByQRCode: function (_qrcode: string, _userId: string) {
            let _table: Table = Tables.collection.findOne({ QR_code: _qrcode });
            let _restaurant: Restaurant;
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });

            if (_lUserDetail.penalties.length === 0) {
                let _lUserPenalty: UserPenalty = UserPenalties.findOne({ user_id: _userId, is_active: true });
                if (_lUserPenalty) {
                    let _lUserPenaltyDays: Parameter = Parameters.findOne({ name: 'penalty_days' });
                    let _lCurrentDate: Date = new Date();
                    let _lDateToCompare: Date = new Date(_lUserPenalty.last_date.setDate((_lUserPenalty.last_date.getDate() + Number(_lUserPenaltyDays.value))));
                    if (_lDateToCompare.getTime() >= _lCurrentDate.getTime()) {
                        let _lDay: number = _lDateToCompare.getDate();
                        let _lMonth: number = _lDateToCompare.getMonth() + 1;
                        let _lYear: number = _lDateToCompare.getFullYear();
                        throw new Meteor.Error('500', _lDay + '/' + _lMonth + '/' + _lYear);
                    } else {
                        UserPenalties.update({ _id: _lUserPenalty._id }, { $set: { is_active: false } });
                    }
                }
            }

            if (_table) {
                _restaurant = Restaurants.collection.findOne({ _id: _table.restaurantId });
                if (_restaurant) {
                    if (_restaurant.isActive) {
                        if (_table.status === 'BUSY') {
                            UserDetails.collection.update({ user_id: _userId },
                                {
                                    $set: {
                                        current_table: _table._id,
                                        current_restaurant: _table.restaurantId
                                    }
                                });
                            Tables.collection.update({ QR_code: _qrcode }, { $set: { amount_people: (_table.amount_people + 1) } });
                        } else if (_table.status === 'FREE') {
                            Tables.collection.update({ QR_code: _qrcode }, { $set: { status: 'BUSY', amount_people: 1 } });
                            Accounts.collection.insert({
                                creation_date: new Date(),
                                creation_user: _userId,
                                restaurantId: _table.restaurantId,
                                tableId: _table._id,
                                status: 'OPEN',
                                total_payment: 0
                            });
                            UserDetails.collection.update({ user_id: _userId },
                                {
                                    $set: {
                                        current_table: _table._id,
                                        current_restaurant: _table.restaurantId
                                    }
                                });
                        }
                        return _restaurant;
                    } else {
                        throw new Meteor.Error('200');
                    }
                } else {
                    throw new Meteor.Error('300');
                }
            } else {
                throw new Meteor.Error('400');
            }
        },

        /**
         * This method return restaurant if exist o null if not
         */

        getCurrentRestaurantByUser: function (_restaurantId: string) {
            let restaurant = Restaurants.collection.findOne({ _id: _restaurantId });

            if (typeof restaurant != "undefined" || restaurant != null) {
                return restaurant;
            } else {
                return null;
            }
        },

        validateRestaurantIsActive: function () {
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            if (userDetail) {
                let restaurant = Restaurants.collection.findOne({ _id: userDetail.restaurant_work });
                return restaurant.isActive;
            } else {
                return false;
            }
        },

        restaurantExit: function (_pUserDetailId: string, _pCurrentRestaurant: string, _pCurrentTable: string) {
            let _lTableAmountPeople: number = Tables.findOne({ _id: _pCurrentTable }).amount_people;
            let _tablesUpdated: number = Tables.collection.update({ _id: _pCurrentTable }, { $set: { amount_people: _lTableAmountPeople - 1 } });
            if (_tablesUpdated === 1) {
                let _lTableAux: Table = Tables.findOne({ _id: _pCurrentTable });
                if (_lTableAux.amount_people === 0 && _lTableAux.status === 'BUSY') {
                    Tables.update({ _id: _pCurrentTable }, { $set: { status: 'FREE' } });
                    let _lAccountAux: Account = Accounts.findOne({ restaurantId: _pCurrentRestaurant, tableId: _pCurrentTable, status: 'OPEN' });
                    Accounts.update({ _id: _lAccountAux._id }, { $set: { status: 'CLOSED' } });
                }
            }
            UserDetails.update({ _id: _pUserDetailId }, { $set: { current_restaurant: '', current_table: '' } });
        },


        restaurantExitWithRegisteredOrders: function (_pUserId: string, _pUserDetailId: string, _pCurrentRestaurant: string, _pCurrentTable: string) {
            Orders.find({
                creation_user: _pUserId, restaurantId: _pCurrentRestaurant, tableId: _pCurrentTable,
                status: 'ORDER_STATUS.REGISTERED'
            }).fetch().forEach((order) => {
                Orders.update({ _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date: new Date() } });
            });
            let _lTableAmountPeople: number = Tables.findOne({ _id: _pCurrentTable }).amount_people;
            let _tablesUpdated: number = Tables.collection.update({ _id: _pCurrentTable }, { $set: { amount_people: _lTableAmountPeople - 1 } });
            if (_tablesUpdated === 1) {
                let _lTableAux: Table = Tables.findOne({ _id: _pCurrentTable });
                if (_lTableAux.amount_people === 0 && _lTableAux.status === 'BUSY') {
                    Tables.update({ _id: _pCurrentTable }, { $set: { status: 'FREE' } });
                    let _lAccountAux: Account = Accounts.findOne({ restaurantId: _pCurrentRestaurant, tableId: _pCurrentTable, status: 'OPEN' });
                    Accounts.update({ _id: _lAccountAux._id }, { $set: { status: 'CLOSED' } });
                }
            }
            UserDetails.update({ _id: _pUserDetailId }, { $set: { current_restaurant: '', current_table: '' } });
        },

        restaurantExitWithOrdersInInvalidStatus: function (_pUserId: string, _pCurrentRestaurant: string, _pCurrentTable: string) {
            let _orderIds: string[] = [];
            Orders.collection.find({
                creation_user: _pUserId, restaurantId: _pCurrentRestaurant, tableId: _pCurrentTable,
                status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
            }).fetch().forEach((order) => {
                Orders.update({ _id: order._id }, { $set: { markedToCancel: true, modification_date: new Date() } });
                _orderIds.push(order._id);
            });
            var data: any = {
                restaurants: _pCurrentRestaurant,
                tables: _pCurrentTable,
                user: _pUserId,
                waiter_id: "",
                status: "waiting",
                type: 'USER_EXIT_TABLE',
            }
            let isWaiterCalls: number = WaiterCallDetails.find({
                restaurant_id: _pCurrentRestaurant, table_id: _pCurrentTable,
                type: 'USER_EXIT_TABLE', status: { $in: ['waiting', 'completed'] }
            }).fetch().length;
            if (isWaiterCalls === 0) {
                Meteor.call('findQueueByRestaurant', data);
            }
            WaiterCallDetails.collection.find({
                restaurant_id: _pCurrentRestaurant, table_id: _pCurrentTable,
                type: 'SEND_ORDER', status: { $in: ['waiting', 'completed'] }, order_id: { $in: _orderIds }
            }).fetch().forEach((call) => {
                Meteor.call('closeWaiterCall', call );
            });
        },

        cancelOrderToRestaurantExit: function (_pOrder: Order, _pCall: WaiterCallDetail, _pWaiterId: string) {
            if (_pOrder.status === 'ORDER_STATUS.PREPARED' && _pOrder.markedToCancel === true) {
                Orders.update({ _id: _pOrder._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date: new Date(), markedToCancel: false } });
            } else if (_pOrder.status === 'ORDER_STATUS.IN_PROCESS' && _pOrder.markedToCancel === true) {
                Orders.update({ _id: _pOrder._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date: new Date() } });
            } else {
                throw new Meteor.Error('200');
            }

            let _lOrdersToCancel: number = Orders.find({
                restaurantId: _pCall.restaurant_id, tableId: _pCall.table_id,
                markedToCancel: { $in: [true, false] }, status: { $in: ['ORDER_STATUS.IN_PROCESS', 'ORDER_STATUS.PREPARED'] }
            }).fetch().length;
            if (_lOrdersToCancel === 0) {
                Meteor.call('closeWaiterCall', _pCall);
            }
        }
    });
}
