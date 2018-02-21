import { Meteor } from 'meteor/meteor';
import { GarnishFoodCol } from '../../../../both/collections/menu/garnish-food.collection';
import { Items } from '../../../../both/collections/menu/item.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication garnishFood with creation user condition
 * @param {String} _userId
 */
Meteor.publish('garnishFood', function (_userId: string) {
    check(_userId, String);
    return GarnishFoodCol.find({ creation_user: _userId });
});

/**
 * Meteor publication return garnish food with establishment condition
 * @param {string} _establishmentId
 */
Meteor.publish('garnishFoodByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return GarnishFoodCol.find({ 'establishments.establishment_id': { $in: [_establishmentId] }, is_active: true });
});

/**
 * Meteor publication return garnish food with _id
 * @param {string} _pId
 */
Meteor.publish('garnishFoodById', function ( _pId: string) {
    check(_pId, String);
    return GarnishFoodCol.find({ _id : _pId });
});

/**
 * Meteor publication return garnish food by itemId  condition
 * @param {string}
 */
Meteor.publish('garnishesByItem', function (_itemId: string) {
    check(_itemId, String);
    var item = Items.findOne({ _id: _itemId, garnishFoodIsAcceped: true });
    if( item ){
        return GarnishFoodCol.find({ _id: { $in: item.garnishFood } });
    } else {
        return;
    }
});

/**
 * Meteor publication garnish food by establishment work
 * @param {string} _userId
 */
Meteor.publish('garnishFoodByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        return GarnishFoodCol.find({ 'establishments.establishment_id': { $in: [_lUserDetail.establishment_work] }, is_active: true });
    } else {
        return;
    }
});

/**
 * Meteor publication return garnish food with userId condition
 * @param {string} _userId
 */
Meteor.publish('garnishFoodByCurrentEstablishment', function ( _userId : string ) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        return GarnishFoodCol.find({ 'establishments.establishment_id': { $in: [_lUserDetail.current_establishment] }, is_active: true });
    } else {
        return;
    }
});
