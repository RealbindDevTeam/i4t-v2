import { Meteor } from 'meteor/meteor';
import { Items } from '../../collections/menu/item.collection';

if (Meteor.isServer) {
  Meteor.methods({
    /**
     * Function to update item available for supervisor
     * @param {UserDetail} _userDetail
     * @param {Item} _item
     */
    updateItemAvailable: function (_restaurantId: string, _itemId: string) {
      let _itemRestaurant = Items.collection.findOne({ _id: _itemId }, { fields: { _id: 0, restaurants: 1 } });
      let aux = _itemRestaurant.restaurants.find(element => element.restaurantId === _restaurantId);
      Items.update({ _id: _itemId, "restaurants.restaurantId": _restaurantId }, { $set: { 'restaurants.$.isAvailable': !aux.isAvailable, modification_date: new Date(), modification_user: Meteor.userId() } });
    }
  })
}



