import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Payment } from '../../../../both/models/establishment/payment.model';
import { Payments } from '../../../../both/collections/establishment/payment.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Account } from '../../../../both/models/establishment/account.model';
import { Accounts } from '../../../../both/collections/establishment/account.collection';

/**
 * Meteor publication payments with userId condition
 * @param {string} _userId
 */
Meteor.publish( 'getUserPayments', function( _userId: string ){
    check( _userId, String );
    return Payments.find( { creation_user: _userId } );
});

/**
 * Meteor publication payments with userId and establishment conditions
 * @param {string} _userId
 * @param {string} _establishmentId
 */
Meteor.publish( 'getUserPaymentsByEstablishment', function( _userId: string, _establishmentId: string ) {
    check( _userId, String );
    check( _establishmentId, String );
    return Payments.find( { creation_user: _userId, establishment_id: _establishmentId } );
});

/**
 * Meteor publication payments with userId, establishmentId and tableId conditions
 * @param {string} _userId
 * @param {string} _establishmentId
 * @param {string} _tableId
 * @param {string[]} _status
 */
Meteor.publish( 'getUserPaymentsByEstablishmentAndTable', function( _userId: string, _establishmentId: string, _tableId: string, _status: string[] ) {
    check( _userId, String );
    check( _establishmentId, String );
    check( _tableId, String );
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        let _lAccount: Account = Accounts.findOne({establishment_id: _lUserDetail.current_establishment, 
                                                    tableId: _lUserDetail.current_table,
                                                    status: 'OPEN'});
        if( _lAccount ){
            return Payments.find( { creation_user: _userId, establishment_id: _establishmentId, tableId: _tableId, accountId: _lAccount._id, status: { $in: _status } } );
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication payments with resturantId and tableId conditions
 * @param {string} _establishmentId
 * @param {string} _tableId
 */
Meteor.publish( 'getPaymentsToWaiter', function( _establishmentId: string, _tableId: string ) {
    check( _establishmentId, String );
    check( _tableId, String );
    return Payments.find( { establishment_id: _establishmentId, tableId: _tableId, status: 'PAYMENT.NO_PAID' } );
});

/**
 * Meteor publication payments with establishment Ids
 * @param {string[]} _pEstablishmentIds
 */
Meteor.publish( 'getPaymentsByEstablishmentIds', function( _pEstablishmentIds: string[] ) {
    return Payments.find( { establishment_id: { $in: _pEstablishmentIds }, status: 'PAYMENT.PAID', received: true } );
});