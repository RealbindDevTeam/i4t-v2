import { Meteor } from 'meteor/meteor';
import { Additions } from '../../../../both/collections/menu/addition.collection';
import { Items } from '../../../../both/collections/menu/item.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication additions with creation user condition
 * @param {string} _userId
 */
Meteor.publish('additions', function (_userId: string) {
    check(_userId, String);
    return Additions.find({ creation_user: _userId });
});

/**
 * Meteor publication return additions with establishment condition
 * @param {string} _establishmentId
 */
Meteor.publish('additionsByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Additions.find({ 'establishments.establishment_id': { $in: [_establishmentId] }, is_active: true });
});

/**
 * Meteor publication return additions with id condition
 * @param {string} _pId
 */
Meteor.publish('additionsById', function ( _pId: string) {
    check(_pId, String);
    return Additions.find({ _id : _pId });
});

/**
 * Meteor publication return additions with userId condition
 * @param {string} _userId
 */
Meteor.publish('additionsByCurrentEstablishment', function ( _userId : string ) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        return Additions.find({ 'establishments.establishment_id': { $in: [_lUserDetail.current_establishment] }, is_active: true });
    } else {
        return;
    }
});

/**
 * Meteor publication return addtions by itemId  condition
 * @param {string} _itemId
*/
Meteor.publish('additionsByItem', function (_itemId: string) {
    check(_itemId, String); 
    var item = Items.findOne({ _id: _itemId, additionsIsAccepted: true });

    if(typeof item !== 'undefined') {
        var aux = Additions.find({ _id: { $in: item.additions } }).fetch();
        return Additions.find({ _id: { $in: item.additions } });
    }else{
        return Additions.find({ _id: { $in: [] } });
    }
});

/**
 * Meteor publication additions by establishment work
 * @param {string} _userId
 */
Meteor.publish('additionsByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if( _lUserDetail ){
        return Additions.find({ 'establishments.establishment_id': { $in: [_lUserDetail.establishment_work] }, is_active: true });
    } else {
        return;
    }
});