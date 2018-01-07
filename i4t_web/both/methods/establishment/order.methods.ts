import { Meteor } from 'meteor/meteor';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
import { Account } from '../../models/establishment/account.model';
import { Accounts } from '../../collections/establishment/account.collection';
import { Order, OrderItem, OrderAddition } from '../../models/establishment/order.model';
import { Orders } from '../../collections/establishment/order.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Establishments } from '../../collections/establishment/establishment.collection';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This Meteor Method add item in user order
         * @param {OrderItem} _itemToInsert
         * @param {string} _tableQRCode
         */
        AddItemToOrder: function (_itemToInsert: OrderItem, _establishmentId: string, _tableQRCode: string, _finalPrice: number) {

            let _lTable: Table = Tables.collection.findOne({ QR_code: _tableQRCode });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });

            if (_lOrder) {
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_itemToInsert.paymentItem.toString());
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
                            orderItemCount: _lOrder.orderItemCount + 1
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
                    items: [_itemToInsert],
                    totalPayment: _finalPrice,
                    orderItemCount: 1,
                    additions: []
                });
            }
        },

        AddItemToOrder2: function (_itemToInsert: OrderItem, _establishmentId: string, _idTable: string, _finalPrice: number) {

            let _lTable: Table = Tables.collection.findOne({ _id: _idTable });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });

            if (_lOrder) {
                let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_itemToInsert.paymentItem.toString());
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
                            orderItemCount: _lOrder.orderItemCount + 1
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
                    items: [_itemToInsert],
                    totalPayment: _finalPrice,
                    orderItemCount: 1,
                    additions: []
                });
            }
        },

        /**
         * This Meteor Method Add Additions to order
         * @param {OrderAddition[]} _additionsToInsert
         * @param {string} _establishmentId
         * @param {string} _tableQRCode
         * @param {number} _AdditionsPrice
         */
        AddAdditionsToOrder: function ( _additionsToInsert: OrderAddition[], _establishmentId: string, _tableQRCode: string, _AdditionsPrice: number ) {
            let _lTable: Table = Tables.collection.findOne({ QR_code: _tableQRCode });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });
            if ( _lOrder ) {
                let _lTotalPaymentAux: number = Number.parseInt( _lOrder.totalPayment.toString() ) + Number.parseInt( _AdditionsPrice.toString() );
                let _lAdditions:OrderAddition[] = Meteor.call('compareAdditionsToInsert', _additionsToInsert, _lOrder );

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
        
        AddAdditionsToOrder2: function ( _additionsToInsert: OrderAddition[], _establishmentId: string, _tableId: string, _AdditionsPrice: number ) {
            let _lTable: Table = Tables.collection.findOne({ _id: _tableId });

            let _lOrder: Order = Orders.collection.findOne({
                creation_user: Meteor.userId(),
                establishment_id: _establishmentId,
                tableId: _lTable._id,
                status: 'ORDER_STATUS.SELECTING'
            });
            if ( _lOrder ) {
                let _lTotalPaymentAux: number = Number.parseInt( _lOrder.totalPayment.toString() ) + Number.parseInt( _AdditionsPrice.toString() );
                let _lAdditions:OrderAddition[] = Meteor.call('compareAdditionsToInsert', _additionsToInsert, _lOrder );

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
        compareAdditionsToInsert: function( _pAdditionsToInsert:OrderAddition[], _pOrder:Order ):OrderAddition[]{
            let _lAdditionsToReturn:OrderAddition[] = _pOrder.additions;

            _pAdditionsToInsert.forEach( ( addToInsert ) => {
                _lAdditionsToReturn.forEach( ( addToReturn ) => {
                    if( addToInsert.additionId === addToReturn.additionId ){
                        addToReturn.quantity = addToReturn.quantity + addToInsert.quantity;
                        addToReturn.paymentAddition = addToReturn.paymentAddition + addToInsert.paymentAddition;                
                    }
                });
            });        

            _pAdditionsToInsert.forEach( ( addToInsert ) => {
                if( _lAdditionsToReturn.filter( ad => ad.additionId === addToInsert.additionId ).length === 0 ){
                    _lAdditionsToReturn.push( addToInsert );
                }
            });
            return _lAdditionsToReturn;
        }
    });
}