import { Meteor } from 'meteor/meteor';
import { CodeGenerator } from './QR/codeGenerator';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
import { UserRewardPoints } from '../../models/auth/user-detail.model';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Order } from '../../models/establishment/order.model';
import { Orders } from '../../collections/establishment/order.collection';
import { WaiterCallDetail } from '../../models/establishment/waiter-call-detail.model';
import { WaiterCallDetails } from '../../collections/establishment/waiter-call-detail.collection';
import { UserDetail } from '../../models/auth/user-detail.model';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';
import { UserPenalty } from '../../models/auth/user-penalty.model';
import { UserPenalties } from '../../collections/auth/user-penalty.collection';
import { RewardPoints } from '../../collections/establishment/reward-point.collection';

/**
 * This function create random code with 9 length to establishments
 */
export function createEstablishmentCode(): string {
    let _lText = '';
    let _lPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let _i = 0; _i < 9; _i++) {
        _lText += _lPossible.charAt(Math.floor(Math.random() * _lPossible.length));
    }
    return _lText;
}

/**
 * This function create random code with 5 length to establishments
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
 * This function create QR Codes to establishments
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
         * This Meteor Method return establishment object with QR Code condition
         * @param {string} _qrcode
         * @param {string} _userId
         */
        getEstablishmentByQRCode: function (_qrcode: string, _userId: string) {
            let _table: Table = Tables.collection.findOne({ QR_code: _qrcode });
            let _establishment: Establishment;
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
                _establishment = Establishments.collection.findOne({ _id: _table.establishment_id });
                if (_establishment) {
                    if (_establishment.isActive) {
                        if (_table.status === 'BUSY') {
                            UserDetails.collection.update({ user_id: _userId },
                                {
                                    $set: {
                                        current_table: _table._id,
                                        current_establishment: _table.establishment_id
                                    }
                                });
                            Tables.collection.update({ QR_code: _qrcode }, { $set: { amount_people: (_table.amount_people + 1) } });
                        } else if (_table.status === 'FREE') {
                            Tables.collection.update({ QR_code: _qrcode }, { $set: { status: 'BUSY', amount_people: 1 } });
                            UserDetails.collection.update({ user_id: _userId },
                                {
                                    $set: {
                                        current_table: _table._id,
                                        current_establishment: _table.establishment_id
                                    }
                                });
                        }
                        if (_lUserDetail.grant_start_points !== undefined && _lUserDetail.grant_start_points) {
                            let _lExpireDate = new Date();
                            let _lUserStartPoints: Parameter = Parameters.findOne({ name: 'user_start_points' });
                            RewardPoints.insert({
                                id_user: _lUserDetail.user_id,
                                establishment_id: _establishment._id,
                                points: Number.parseInt(_lUserStartPoints.value.toString()),
                                days_to_expire: Number.parseInt(_establishment.points_validity.toString()),
                                gain_date: new Date(),
                                expire_date: new Date(_lExpireDate.setDate(_lExpireDate.getDate() + Number.parseInt(_establishment.points_validity.toString()))),
                                is_active: true
                            });
                            if (_lUserDetail.reward_points === null || _lUserDetail.reward_points === undefined) {
                                let _lUserReward: UserRewardPoints = { index: 1, establishment_id: _establishment._id, points: Number.parseInt(_lUserStartPoints.value.toString()) }
                                UserDetails.update({ _id: _lUserDetail._id }, { $set: { reward_points: [_lUserReward] } });
                            }
                            UserDetails.update({ _id: _lUserDetail._id }, { $set: { grant_start_points: false } });
                        }
                        return _establishment;
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
         * This method return establishment if exist o null if not
         */

        getCurrentEstablishmentByUser: function (_establishmentId: string) {
            let establishment = Establishments.collection.findOne({ _id: _establishmentId });

            if (typeof establishment != "undefined" || establishment != null) {
                return establishment;
            } else {
                return null;
            }
        },

        validateEstablishmentIsActive: function () {
            let userDetail = UserDetails.collection.findOne({ user_id: this.userId });
            if (userDetail) {
                let establishment = Establishments.collection.findOne({ _id: userDetail.establishment_work });
                return establishment.isActive;
            } else {
                return false;
            }
        },

        establishmentExit: function (_pUserId: string, _pCurrentEstablishment: string, _pCurrentTable: string) {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });
            let _lTableAmountPeople: number = Tables.findOne({ _id: _pCurrentTable }).amount_people;
            let _tablesUpdated: number = Tables.collection.update({ _id: _pCurrentTable }, { $set: { amount_people: _lTableAmountPeople - 1 } });

            if (_tablesUpdated === 1) {
                let _lTableAux: Table = Tables.findOne({ _id: _pCurrentTable });
                if (_lTableAux.amount_people === 0 && _lTableAux.status === 'BUSY') {
                    Tables.update({ _id: _pCurrentTable }, { $set: { status: 'FREE' } });
                }
            }

            let _usersUpdated: number = UserDetails.collection.update({ _id: _lUserDetail._id }, { $set: { current_establishment: '', current_table: '' } });
            if (_usersUpdated === 0) {
                throw new Meteor.Error('300');
            }
        },


        establishmentExitWithSelectedOrders: function (_pUserId: string, _pCurrentEstablishment: string, _pCurrentTable: string) {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });

            Orders.find({
                creation_user: _pUserId, establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable,
                status: 'ORDER_STATUS.SELECTING'
            }).fetch().forEach((order) => {
                order.items.forEach((it) => {
                    if (it.is_reward) {
                        let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: order.creation_user });
                        let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === order.establishment_id)[0];
                        let _lNewPoints: number = Number.parseInt(_lPoints.points.toString()) + Number.parseInt(it.redeemed_points.toString());

                        UserDetails.update({ _id: _lConsumerDetail._id }, { $pull: { reward_points: { establishment_id: order.establishment_id } } });
                        UserDetails.update({ _id: _lConsumerDetail._id }, { $push: { reward_points: { index: _lPoints.index, establishment_id: order.establishment_id, points: _lNewPoints } } });

                        let _lRedeemedPoints: number = it.redeemed_points;
                        let _lValidatePoints: boolean = true;
                        RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: order.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                            if (_lValidatePoints) {
                                if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                                    let aux: number = pnt.points - pnt.difference;
                                    _lRedeemedPoints = _lRedeemedPoints - aux;
                                    RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                                } else if (!pnt.is_active) {
                                    _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                                    RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                                    if (_lRedeemedPoints === 0) {
                                        _lValidatePoints = false;
                                    }
                                }
                            }
                        });
                    }
                });
                Orders.update({ _id: order._id }, { $set: { status: 'ORDER_STATUS.CANCELED', modification_date: new Date() } });
            });

            let _lTableAmountPeople: number = Tables.findOne({ _id: _pCurrentTable }).amount_people;
            let _tablesUpdated: number = Tables.collection.update({ _id: _pCurrentTable }, { $set: { amount_people: _lTableAmountPeople - 1 } });
            if (_tablesUpdated === 1) {
                let _lTableAux: Table = Tables.findOne({ _id: _pCurrentTable });
                if (_lTableAux.amount_people === 0 && _lTableAux.status === 'BUSY') {
                    Tables.update({ _id: _pCurrentTable }, { $set: { status: 'FREE' } });
                }
            }
            let _usersUpdated: number = UserDetails.collection.update({ _id: _lUserDetail._id }, { $set: { current_establishment: '', current_table: '' } });
            if (_usersUpdated === 0) {
                throw new Meteor.Error('300');
            }
        }
    });
}
