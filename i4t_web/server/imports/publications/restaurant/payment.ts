import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Payment } from '../../../../both/models/restaurant/payment.model';
import { Payments } from '../../../../both/collections/restaurant/payment.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { Account } from '../../../../both/models/restaurant/account.model';
import { Accounts } from '../../../../both/collections/restaurant/account.collection';

/**
 * Meteor publication payments with userId condition
 * @param {string} _userId
 */
Meteor.publish( 'getUserPayments', function( _userId: string ){
    check( _userId, String );
    return Payments.find( { creation_user: _userId } );
});

/**
 * Meteor publication payments with userId and restaurant conditions
 * @param {string} _userId
 * @param {string} _restaurantId
 */
Meteor.publish( 'getUserPaymentsByRestaurant', function( _userId: string, _restaurantId: string ) {
    check( _userId, String );
    check( _restaurantId, String );
    return Payments.find( { creation_user: _userId, restaurantId: _restaurantId } );
});

/**
 * Meteor publication payments with userId, restaurantId and tableId conditions
 * @param {string} _userId
 * @param {string} _restaurantId
 * @param {string} _tableId
 * @param {string[]} _status
 */
Meteor.publish( 'getUserPaymentsByRestaurantAndTable', function( _userId: string, _restaurantId: string, _tableId: string, _status: string[] ) {
    check( _userId, String );
    check( _restaurantId, String );
    check( _tableId, String );
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        let _lAccount: Account = Accounts.findOne({restaurantId: _lUserDetail.current_restaurant, 
                                                    tableId: _lUserDetail.current_table,
                                                    status: 'OPEN'});
        if( _lAccount ){
            return Payments.find( { creation_user: _userId, restaurantId: _restaurantId, tableId: _tableId, accountId: _lAccount._id, status: { $in: _status } } );
        } else {
            return;
        }
    } else {
        return;
    }
});

/**
 * Meteor publication payments with resturantId and tableId conditions
 * @param {string} _restaurantId
 * @param {string} _tableId
 */
Meteor.publish( 'getPaymentsToWaiter', function( _restaurantId: string, _tableId: string ) {
    check( _restaurantId, String );
    check( _tableId, String );
    return Payments.find( { restaurantId: _restaurantId, tableId: _tableId, status: 'PAYMENT.NO_PAID' } );
});

/**
 * Meteor publication payments with restaurant Ids
 * @param {string[]} _pRestaurantIds
 */
Meteor.publish( 'getPaymentsByRestaurantIds', function( _pRestaurantIds: string[] ) {
    return Payments.find( { restaurantId: { $in: _pRestaurantIds }, status: 'PAYMENT.PAID', received: true } );
});