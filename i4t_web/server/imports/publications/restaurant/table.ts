import { Meteor } from 'meteor/meteor';
import { Tables } from '../../../../both/collections/restaurant/table.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication tables with user creation condition
 * @param {string} _userId
 */
Meteor.publish('tables', function (_userId: string) {
    check(_userId, String);
    return Tables.find({ creation_user: _userId });
});

/**
 * Meteor publication tables
 * @param {string} _tableId
 */
Meteor.publish('getTableById', function (_tableId: string) {
    check(_tableId, String);
    return Tables.find({ _id: _tableId });
});

/**
 * Meteor publication table by current_table
 */
Meteor.publish('getTableByCurrentTable', function (_userId: string) {
    check(_userId, String);

    var user_detail = UserDetails.findOne({ user_id: _userId });
    if( user_detail ){
        return Tables.find({ _id: user_detail.current_table });
    } else {
        return;
    }
});

/**
 * Meteor publication return all tables
 */
Meteor.publish( 'getAllTables', function( ){
    return Tables.find( { } );
});

/**
 * Meteor publication return tables with restaurant condition
 * @param {string} _restaurantId
 */
Meteor.publish( 'getTablesByRestaurant', function( _restaurantId:string ) {
    check( _restaurantId, String );
    return Tables.find( { restaurantId: _restaurantId } );
});

/**
 * Meteor publication return tables by restaurant Work
 * @param {string} _userId
 */
Meteor.publish( 'getTablesByRestaurantWork', function( _userId: string ){
    check( _userId, String );
    let _lUserDetail: UserDetail = UserDetails.findOne( { user_id: _userId } );
    if( _lUserDetail ){
        return Tables.find( { restaurantId: _lUserDetail.restaurant_work } );
    } else {
        return;
    }
});

/**
 * Meteor publication tables by QR Code
 * @param {string} _lQRCode
 */
Meteor.publish('getTableByQRCode', function ( _lQRCode: string ){
    check(_lQRCode, String);
    return Tables.find( { QR_code: _lQRCode } );
});