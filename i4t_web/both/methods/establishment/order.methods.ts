import { Meteor } from 'meteor/meteor';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
import { Order, OrderItem, OrderAddition } from '../../models/establishment/order.model';
import { Orders } from '../../collections/establishment/order.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { UserDetail, UserRewardPoints } from '../../models/auth/user-detail.model';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { RewardPoint } from '../../models/establishment/reward-point.model';
import { RewardPoints } from '../../collections/establishment/reward-point.collection';
import { EstablishmentPoint } from '../../models/points/establishment-point.model';
import { EstablishmentPoints } from '../../collections/points/establishment-points.collection';
import { NegativePoint } from '../../models/points/negative-point.model';
import { NegativePoints } from '../../collections/points/negative-points.collection';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This Meteor Method add item in user order
         * @param {OrderItem} _itemToInsert
         * @param {string} _tableQRCode
         */
        AddItemToOrder: function (_itemToInsert: OrderItem, _establishmentId: string, _tableQRCode: string, _finalPrice: number, _finalPoints: number) {

            let _lTable: Table = Tables.collection.findOne({ QR_code: _tableQRCode });
            let _lEstablishment: Establishment = Establishments.collection.findOne({ _id: _establishmentId });
            let _finalOrderId: string = '';

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });

            if (_lOrder) {
                _finalOrderId = _lOrder._id;
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_itemToInsert.paymentItem.toString());
                let _lTotalPointsAux: number = Number.parseInt(_lOrder.total_reward_points.toString()) + Number.parseInt(_itemToInsert.reward_points.toString());
                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    { $push: { items: _itemToInsert } }
                );
                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    {
                        $set: {
                            modification_user: Meteor.userId(),
                            modification_date: new Date(),
                            totalPayment: _lTotalPaymentAux,
                            orderItemCount: _lOrder.orderItemCount + 1,
                            total_reward_points: _lTotalPointsAux
                        }
                    }
                );
            } else {
                let _orderCount: number = _lEstablishment.orderNumberCount + 1;
                _lEstablishment.orderNumberCount = _orderCount;

                Establishments.update({ _id: _lEstablishment._id }, _lEstablishment);
                _finalOrderId = Orders.collection.insert({
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    code: _orderCount,
                    status: 'ORDER_STATUS.SELECTING',
                    items: [_itemToInsert],
                    totalPayment: _finalPrice,
                    orderItemCount: 1,
                    additions: [],
                    total_reward_points: _finalPoints
                });
            }
            if (_itemToInsert.is_reward) {
                let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _lEstablishment._id)[0];
                UserDetails.update({ _id: _lConsumerDetail._id, 'reward_points.establishment_id': _lEstablishment._id },
                    { $set: { 'reward_points.$.points': (_lPoints.points - _itemToInsert.redeemed_points) } });

                let _points: number = _itemToInsert.redeemed_points;
                let _validate_points: boolean = true;
                RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: _lEstablishment._id, is_active: true }, { sort: { gain_date: 1 } }).fetch().forEach((pnt) => {
                    if (_validate_points) {
                        _points = _points - pnt.points;
                        if (_points >= 0) {
                            RewardPoints.update({ _id: pnt._id }, { $set: { is_active: false } });
                            _validate_points = true;
                        } else {
                            RewardPoints.update({ _id: pnt._id }, { $set: { difference: (_points * -1) } });
                            _validate_points = false;
                        }
                    }
                });

                let _establishmentPoints: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _lEstablishment._id });
                let _pointsResult: number = Number.parseInt(_establishmentPoints.current_points.toString()) - Number.parseInt(_itemToInsert.redeemed_points.toString());

                if (_pointsResult >= 0) {
                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult } });
                } else {
                    let _negativePoints: number;
                    if (_establishmentPoints.current_points > 0) {
                        _negativePoints = Number.parseInt(_itemToInsert.redeemed_points.toString()) - Number.parseInt(_establishmentPoints.current_points.toString());
                        if (_negativePoints < 0) { _negativePoints = (_negativePoints * (-1)); }
                    } else {
                        _negativePoints = Number.parseInt(_itemToInsert.redeemed_points.toString());
                    }
                    NegativePoints.insert({
                        establishment_id: _lEstablishment._id,
                        order_id: _finalOrderId,
                        user_id: _lConsumerDetail.user_id,
                        redeemed_points: Number.parseInt(_itemToInsert.redeemed_points.toString()),
                        points: _negativePoints,
                        was_cancelled: false,
                        paid: false
                    });
                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult, negative_balance: true } });
                }
            }
        },

        AddItemToOrder2: function (_itemToInsert: OrderItem, _establishmentId: string, _idTable: string, _finalPrice: number, _finalPoints: number) {

            let _lTable: Table = Tables.collection.findOne({ _id: _idTable });
            let _lEstablishment: Establishment = Establishments.collection.findOne({ _id: _establishmentId });
            let _finalOrderId: string = '';

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });

            if (_lOrder) {
                _finalOrderId = _lOrder._id;
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_itemToInsert.paymentItem.toString());
                let _lTotalPointsAux: number = Number.parseInt(_lOrder.total_reward_points.toString()) + Number.parseInt(_itemToInsert.reward_points.toString());
                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    { $push: { items: _itemToInsert } }
                );
                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    {
                        $set: {
                            modification_user: Meteor.userId(),
                            modification_date: new Date(),
                            totalPayment: _lTotalPaymentAux,
                            orderItemCount: _lOrder.orderItemCount + 1,
                            total_reward_points: _lTotalPointsAux
                        }
                    }
                );
            } else {
                let _orderCount: number = _lEstablishment.orderNumberCount + 1;
                _lEstablishment.orderNumberCount = _orderCount;

                Establishments.update({ _id: _lEstablishment._id }, _lEstablishment);
                _finalOrderId = Orders.collection.insert({
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    code: _orderCount,
                    status: 'ORDER_STATUS.SELECTING',
                    items: [_itemToInsert],
                    totalPayment: _finalPrice,
                    orderItemCount: 1,
                    additions: [],
                    total_reward_points: _finalPoints
                });
            }
            if (_itemToInsert.is_reward) {
                let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: Meteor.userId() });
                let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _lEstablishment._id)[0];
                UserDetails.update({ _id: _lConsumerDetail._id, 'reward_points.establishment_id': _lEstablishment._id },
                    { $set: { 'reward_points.$.points': (_lPoints.points - _itemToInsert.redeemed_points) } });

                let _points: number = _itemToInsert.redeemed_points;
                let _validate_points: boolean = true;
                RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: _lEstablishment._id, is_active: true }, { sort: { gain_date: 1 } }).fetch().forEach((pnt) => {
                    if (_validate_points) {
                        _points = _points - pnt.points;
                        if (_points >= 0) {
                            RewardPoints.update({ _id: pnt._id }, { $set: { is_active: false } });
                            _validate_points = true;
                        } else {
                            RewardPoints.update({ _id: pnt._id }, { $set: { difference: (_points * -1) } });
                            _validate_points = false;
                        }
                    }
                });

                let _establishmentPoints: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _lEstablishment._id });
                let _pointsResult: number = Number.parseInt(_establishmentPoints.current_points.toString()) - Number.parseInt(_itemToInsert.redeemed_points.toString());

                if (_pointsResult >= 0) {
                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult } });
                } else {
                    let _negativePoints: number;
                    if (_establishmentPoints.current_points > 0) {
                        _negativePoints = Number.parseInt(_itemToInsert.redeemed_points.toString()) - Number.parseInt(_establishmentPoints.current_points.toString());
                        if (_negativePoints < 0) { _negativePoints = (_negativePoints * (-1)); }
                    } else {
                        _negativePoints = Number.parseInt(_itemToInsert.redeemed_points.toString());
                    }
                    NegativePoints.insert({
                        establishment_id: _lEstablishment._id,
                        order_id: _finalOrderId,
                        user_id: _lConsumerDetail.user_id,
                        redeemed_points: Number.parseInt(_itemToInsert.redeemed_points.toString()),
                        points: _negativePoints,
                        was_cancelled: false,
                        paid: false
                    });
                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult, negative_balance: true } });
                }
            }
        },

        /**
         * This Meteor Method Add Additions to order
         * @param {OrderAddition[]} _additionsToInsert
         * @param {string} _establishmentId
         * @param {string} _tableQRCode
         * @param {number} _AdditionsPrice
         */
        AddAdditionsToOrder: function (_additionsToInsert: OrderAddition[], _establishmentId: string, _tableQRCode: string, _AdditionsPrice: number) {
            let _lTable: Table = Tables.collection.findOne({ QR_code: _tableQRCode });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });
            if (_lOrder) {
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_AdditionsPrice.toString());
                let _lAdditions: OrderAddition[] = Meteor.call('compareAdditionsToInsert', _additionsToInsert, _lOrder);

                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    {
                        $set: {
                            modification_user: Meteor.userId(),
                            modification_date: new Date(),
                            totalPayment: _lTotalPaymentAux,
                            additions: _lAdditions
                        }
                    }
                );
            } else {
                let _lEstablishment: Establishment = Establishments.collection.findOne({ _id: _establishmentId });
                let _orderCount: number = _lEstablishment.orderNumberCount + 1;
                _lEstablishment.orderNumberCount = _orderCount;

                Establishments.update({ _id: _lEstablishment._id }, _lEstablishment);
                Orders.insert({
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    code: _orderCount,
                    status: 'ORDER_STATUS.SELECTING',
                    items: [],
                    totalPayment: _AdditionsPrice,
                    orderItemCount: 0,
                    additions: _additionsToInsert
                });
            }
        },

        AddAdditionsToOrder2: function (_additionsToInsert: OrderAddition[], _establishmentId: string, _tableId: string, _AdditionsPrice: number) {
            let _lTable: Table = Tables.collection.findOne({ _id: _tableId });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });
            if (_lOrder) {
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_AdditionsPrice.toString());
                let _lAdditions: OrderAddition[] = Meteor.call('compareAdditionsToInsert', _additionsToInsert, _lOrder);

                Orders.update({
                    creation_user: Meteor.userId(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    status: 'ORDER_STATUS.SELECTING'
                },
                    {
                        $set: {
                            modification_user: Meteor.userId(),
                            modification_date: new Date(),
                            totalPayment: _lTotalPaymentAux,
                            additions: _lAdditions
                        }
                    }
                );
            } else {
                let _lEstablishment: Establishment = Establishments.collection.findOne({ _id: _establishmentId });
                let _orderCount: number = _lEstablishment.orderNumberCount + 1;
                _lEstablishment.orderNumberCount = _orderCount;

                Establishments.update({ _id: _lEstablishment._id }, _lEstablishment);
                Orders.insert({
                    creation_user: Meteor.userId(),
                    creation_date: new Date(),
                    establishment_id: _establishmentId,
                    tableId: _lTable._id,
                    code: _orderCount,
                    status: 'ORDER_STATUS.SELECTING',
                    items: [],
                    totalPayment: _AdditionsPrice,
                    orderItemCount: 0,
                    additions: _additionsToInsert
                });
            }
        },
        /**
         * This function compare additions to insert and create new array
         * @param {OrderAddition[]} _pAdditionsToInsert 
         */
        compareAdditionsToInsert: function (_pAdditionsToInsert: OrderAddition[], _pOrder: Order): OrderAddition[] {
            let _lAdditionsToReturn: OrderAddition[] = _pOrder.additions;

            _pAdditionsToInsert.forEach((addToInsert) => {
                _lAdditionsToReturn.forEach((addToReturn) => {
                    if (addToInsert.additionId === addToReturn.additionId) {
                        addToReturn.quantity = addToReturn.quantity + addToInsert.quantity;
                        addToReturn.paymentAddition = addToReturn.paymentAddition + addToInsert.paymentAddition;
                    }
                });
            });

            _pAdditionsToInsert.forEach((addToInsert) => {
                if (_lAdditionsToReturn.filter(ad => ad.additionId === addToInsert.additionId).length === 0) {
                    _lAdditionsToReturn.push(addToInsert);
                }
            });
            return _lAdditionsToReturn;
        }
    });
}