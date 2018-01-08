import { Meteor } from 'meteor/meteor';
import { CodeGenerator } from './QR/codeGenerator';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
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

            UserDetails.update({ _id: _lUserDetail._id }, { $set: { current_establishment: '', current_table: '' } });
        },


        establishmentExitWithSelectedOrders: function (_pUserId: string, _pCurrentEstablishment: string, _pCurrentTable: string) {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });

            Orders.find({
                creation_user: _pUserId, establishment_id: _pCurrentEstablishment, tableId: _pCurrentTable,
                status: 'ORDER_STATUS.SELECTING'
            }).fetch().forEach((order) => {
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
            UserDetails.update({ _id: _lUserDetail._id }, { $set: { current_establishment: '', current_table: '' } });
        }
    });
}
