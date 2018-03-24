import { Meteor } from 'meteor/meteor';
import { Items } from '../../collections/menu/item.collection';

if (Meteor.isServer) {
  Meteor.methods({
    /**
     * Function to update item available for supervisor
     * @param {UserDetail} _userDetail
     * @param {Item} _item
     */
    updateItemAvailable: function (_establishmentId: string, _itemId: string) {
      let _itemEstablishment = Items.collection.findOne({ _id: _itemId }, { fields: { _id: 0, establishments: 1 } });
      let aux = _itemEstablishment.establishments.find(element => element.establishment_id === _establishmentId);
      Items.update({ _id: _itemId, "establishments.establishment_id": _establishmentId }, { $set: { 'establishments.$.isAvailable': !aux.isAvailable, modification_date: new Date(), modification_user: Meteor.userId() } });
    },
    
    /**
     * Function to update item recommended
     * @param {UserDetail} _userDetail
     * @param {Item} _item
     */
    updateRecommended: function (_establishmentId: string, _itemId: string) {
      let _itemEstablishment = Items.collection.findOne({ _id: _itemId }, { fields: { _id: 0, establishments: 1 } });
      let aux = _itemEstablishment.establishments.find(element => element.establishment_id === _establishmentId);
      Items.update({ _id: _itemId, "establishments.establishment_id": _establishmentId }, { $set: { 'establishments.$.recommended': !aux.recommended, modification_date: new Date(), modification_user: Meteor.userId() } });
    }
  })
}



