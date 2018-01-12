import { Component, OnInit, OnDestroy, Input, NgZone, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Order, OrderItem, OrderAddition } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
import { GarnishFood } from '../../../../../../../both/models/menu/garnish-food.model';
import { GarnishFoodCol } from '../../../../../../../both/collections/menu/garnish-food.collection';
import { Addition } from '../../../../../../../both/models/menu/addition.model';
import { Additions } from '../../../../../../../both/collections/menu/addition.collection';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Tables } from '../../../../../../../both/collections/establishment/table.collection';
import { Reward } from '../../../../../../../both/models/establishment/reward.model';
import { Rewards } from '../../../../../../../both/collections/establishment/reward.collection';
import { RewardsDetailComponent } from '../../rewards-detail/rewards-detail.component';

@Component({
    selector: 'order-list',
    templateUrl: './order-list.component.html',
    styleUrls: ['./order-list.component.scss']
})
export class OrdersListComponent implements OnInit, OnDestroy {

    @Input() establishmentId: string;
    @Input() tableQRCode: string;
    @Input() establishmentCurrency: string;
    @Output() createNewOrder = new EventEmitter();

    private _user = Meteor.userId();
    private _ordersSub: Subscription;
    private _itemsSub: Subscription;
    private _garnishFoodSub: Subscription;
    private _additionsSub: Subscription;
    private _currenciesSub: Subscription;
    private _establishmentSub: Subscription;
    private _tablesSub: Subscription;
    private _rewardsSub: Subscription;
    private _mdDialogRef: MatDialogRef<any>;

    private _orders: Observable<Order[]>;
    private _ordersTable: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _itemsToShowDetail: Observable<Item[]>;
    private _garnishFoodCol: Observable<GarnishFood[]>;
    private _additions: Observable<Addition[]>;
    private _additionDetails: Observable<Addition[]>;
    private _establishments: Observable<Establishment[]>;
    private _rewards: Observable<Reward[]>;

    private _showOrderItemDetail: boolean = false;
    private _currentOrder: Order;
    private _customerCanEdit: boolean = false;
    private _showDetails: boolean = false;

    private _editOrderItemForm: FormGroup;
    private _garnishFormGroup: FormGroup = new FormGroup({});
    private _additionsFormGroup: FormGroup = new FormGroup({});
    private _additionsDetailFormGroup: FormGroup = new FormGroup({});

    private _orderItemGarnishFood: string[] = [];
    private _orderItemAdditions: string[] = [];

    private _maxGarnishFoodElements: number = 0;
    private _garnishFoodElementsCount: number = 0;
    private _showGarnishFoodError: boolean = false;

    private _lastQuantity: number = 1;
    private _quantityCount: number = 1;
    private _finalPrice: number = 0;
    private _unitPrice: number = 0;
    private _orderItemIndex: number = -1;
    private _currencyCode: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    _initialValue = 'all';
    private _showCustomerOrders: boolean = true;
    private _showOtherOrders: boolean = true;
    private _showAllOrders: boolean = true;
    private _orderCustomerIndex: number = -1;
    private _orderOthersIndex: number = -1;
    private _thereAreUserOrders: boolean = true;
    private _thereAreNotUserOrders: boolean = true;
    private _tableNumber: number;
    private _loading: boolean = false;
    private _showReedemPoints: boolean = true;

    /**
     * OrdersListComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone
     * @param {MatSnackBar} snackBar
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _router: Router) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Show the detail header
     */
    showHeaderDetail() {
        var _lScrollTop = document.getElementById("is").scrollTop;
        if (_lScrollTop > 0) {
            document.getElementById("mt").classList.remove('header-detail-hide');
            document.getElementById("mt").classList.add('header-detail-show');
        } else {
            document.getElementById("mt").classList.remove('header-detail-show');
            document.getElementById("mt").classList.add('header-detail-hide');
        }
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._ordersSub = MeteorObservable.subscribe('getOrders', this.establishmentId, this.tableQRCode, ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).subscribe(() => {
            this._ngZone.run(() => {
                this.countUserOrders();
                this._orders = Orders.find({ creation_user: this._user }).zone();
                this._orders.subscribe(() => { this.countUserOrders(); });
                this.countNotUserOrders();
                this._ordersTable = Orders.find({ creation_user: { $not: this._user } }).zone();
                this._ordersTable.subscribe(() => { this.countNotUserOrders(); });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._showOrderItemDetail = false;

        this._editOrderItemForm = new FormGroup({
            observations: new FormControl('', [Validators.maxLength(50)]),
            garnishFood: this._garnishFormGroup,
            additions: this._additionsFormGroup
        });

        this._garnishFoodSub = MeteorObservable.subscribe('garnishFoodByEstablishment', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._garnishFoodCol = GarnishFoodCol.find({}).zone();
            });
        });
        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this.establishmentId]).subscribe(() => {
            this._ngZone.run(() => {
                this._currencyCode = Currencies.findOne({ _id: this.establishmentCurrency }).code + ' ';
            });
        });
        this._establishmentSub = MeteorObservable.subscribe('getEstablishmentById', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this.establishmentId }).zone();
            });
        });
        this._tablesSub = MeteorObservable.subscribe('getTableByQRCode', this.tableQRCode).subscribe(() => {
            this._ngZone.run(() => {
                this._tableNumber = Tables.collection.findOne({ QR_code: this.tableQRCode })._number;
            });
        });
        this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [this.establishmentId] } }).zone();
                this.countRewards();
                this._rewards.subscribe(() => { this.countRewards(); });
            });
        });
    }

    /**
     * Validate if user orders exists
     */
    countUserOrders(): void {
        Orders.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreUserOrders = true : this._thereAreUserOrders = false;
    }

    /**
     * Validate if not user orders exists
     */
    countNotUserOrders(): void {
        Orders.collection.find({ creation_user: { $not: this._user } }).count() > 0 ? this._thereAreNotUserOrders = true : this._thereAreNotUserOrders = false;
    }

    /**
     * Validate if establishment rewards exists
     */
    countRewards(): void {
        Rewards.collection.find({ establishments: { $in: [this.establishmentId] } }).count() > 0 ? this._showReedemPoints = true : this._showReedemPoints = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._ordersSub) { this._ordersSub.unsubscribe(); }
        if (this._itemsSub) { this._itemsSub.unsubscribe(); }
        if (this._garnishFoodSub) { this._garnishFoodSub.unsubscribe(); }
        if (this._additionsSub) { this._additionsSub.unsubscribe(); }
        if (this._currenciesSub) { this._currenciesSub.unsubscribe(); }
        if (this._establishmentSub) { this._establishmentSub.unsubscribe(); }
        if (this._tablesSub) { this._tablesSub.unsubscribe(); }
        if (this._rewardsSub) { this._rewardsSub.unsubscribe(); }
    }

    /**
     * This function allow filter orders
     * @param {number} _pFilter
     */
    changeOrderFilter(_pFilter: string) {
        if (_pFilter === 'all') {
            this._showAllOrders = true;
            this._showCustomerOrders = true;
            this._showOtherOrders = true;
        } else if (_pFilter === 'customer') {
            this._showAllOrders = false;
            this._showCustomerOrders = true;
            this._showOtherOrders = false;
        } else if (_pFilter === 'other') {
            this._showAllOrders = false;
            this._showCustomerOrders = false;
            this._showOtherOrders = true;
        }
        this._showDetails = false;
        this.viewItemDetail('item-selected', true);
    }

    /**
     * This function allow view item detail
     * @param _pDiv 
     * @param _boolean 
     */
    viewItemDetail(_pDiv: string, _boolean: boolean): void {
        var card = document.getElementById(_pDiv);
        if (!_boolean) {
            card.classList.add('item-detail-show');
            card.classList.remove('item-detail-hidden');
        } else {
            card.classList.add('item-detail-hidden');
        }
    }

    /**
     * Delete OrderItem in order
     * @param {Order} _pOrder 
     * @param {string} _pItemId 
     */
    deleteOrderItem(_pItemId: string): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_LIST.DELETE_ITEM_DLG'),
                subtitle: '',
                content: this.itemNameTraduction("ORDER_LIST.DELETE_ORDER"),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                let _lOrderItemToremove: OrderItem = this._currentOrder.items.filter(o => _pItemId === o.itemId && o.index === this._orderItemIndex)[0];
                let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderItemToremove.paymentItem;

                Orders.update({ _id: this._currentOrder._id }, { $pull: { items: { itemId: _pItemId, index: this._orderItemIndex } } });
                Orders.update({ _id: this._currentOrder._id },
                    {
                        $set: {
                            totalPayment: _lNewTotalPayment,
                            modification_user: this._user,
                            modification_date: new Date()
                        }
                    }
                );

                this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
                if (this._currentOrder.items.length === 0 && this._currentOrder.additions.length === 0) {
                    Orders.update({ _id: this._currentOrder._id }, {
                        $set: {
                            status: 'ORDER_STATUS.CANCELED', modification_user: this._user,
                            modification_date: new Date()
                        }
                    });
                }
                this.viewItemDetail('item-selected', true);
                this._showOrderItemDetail = false;
                let _lMessage: string = this.itemNameTraduction('ORDER_LIST.ITEM_DELETED');
                this.snackBar.open(_lMessage, '', {
                    duration: 2500
                });
            }
        });
    }

    /**
     * Delete OrderAddition in order
     * @param {string} _pAdditionId 
     */
    deleteOrderAddition(_pAdditionId: string): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_LIST.DELETE_ADITION_DLG'),
                subtitle: '',
                content: this.itemNameTraduction("ORDER_LIST.DELETE_ADDITION_CONFIRM"),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                let _lOrderAdditionToremove: OrderAddition = this._currentOrder.additions.filter(ad => ad.additionId === _pAdditionId)[0];
                let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderAdditionToremove.paymentAddition;

                Orders.update({ _id: this._currentOrder._id }, { $pull: { additions: { additionId: _pAdditionId } } });
                Orders.update({ _id: this._currentOrder._id },
                    {
                        $set: {
                            totalPayment: _lNewTotalPayment,
                            modification_user: this._user,
                            modification_date: new Date()
                        }
                    }
                );
                this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
                if (this._currentOrder.additions.length === 0 && this._currentOrder.items.length === 0) {
                    Orders.update({ _id: this._currentOrder._id }, {
                        $set: {
                            status: 'ORDER_STATUS.CANCELED', modification_user: this._user,
                            modification_date: new Date()
                        }
                    });
                }
                this.viewItemDetail('addition-detail', true);
                let _lMessage: string = this.itemNameTraduction('ORDER_LIST.ADDITION_DELETED');
                this.snackBar.open(_lMessage, '', {
                    duration: 2500
                });
            }
        });
    }

    /**
     * Show customer order detail
     * @param {Order} _pOrder
     * @param {number} _pIndex
     */
    showCustomerOrderDetail(_pOrder: Order, _pIndex: number): void {
        if (this._orderCustomerIndex == _pIndex) {
            this._orderCustomerIndex = -1;
        } else {
            this._orderCustomerIndex = _pIndex;
        }

        if (_pOrder.status === 'ORDER_STATUS.SELECTING') {
            this._customerCanEdit = true;
            this._editOrderItemForm.controls['observations'].enable();
        } else {
            this._editOrderItemForm.controls['observations'].disable();
            this._customerCanEdit = false;
        }
        this._orderOthersIndex = -1;
        this._currentOrder = _pOrder;
        this.resetEditionValues();

        this._showOrderItemDetail = false;
        this._showDetails = true;
        this.viewItemDetail('addition-detail', true);
        this.viewItemDetail('item-selected', true);
    }

    /**
     * Show table order detail
     * @param {Order} _pOrder 
     * @param {number} _pIndex
     */
    showOthersOrderDetail(_pOrder: Order, _pIndex: number): void {
        if (this._orderOthersIndex == _pIndex) {
            this._orderOthersIndex = -1;
        } else {
            this._orderOthersIndex = _pIndex;
        }
        this._orderCustomerIndex = -1;
        this._editOrderItemForm.controls['observations'].disable();
        this._customerCanEdit = false;
        this._currentOrder = _pOrder;
        this.resetEditionValues();

        this._showOrderItemDetail = false;
        this._showDetails = true;
        this.viewItemDetail('addition-detail', true);
        this.viewItemDetail('item-selected', true);
    }

    /**
     * Show order item detail
     * @param {OrderItem} _pOrderItem 
     */
    showOrderItemDetail(_pOrderItem: OrderItem): void {
        this.resetEditionValues();

        this._orderItemIndex = _pOrderItem.index;
        this._quantityCount = _pOrderItem.quantity;
        this._editOrderItemForm.controls['observations'].setValue(_pOrderItem.observations);
        this._orderItemGarnishFood = _pOrderItem.garnishFood;
        this._orderItemAdditions = _pOrderItem.additions;
        this._finalPrice = _pOrderItem.paymentItem;

        this._itemsToShowDetail = Items.find({ _id: _pOrderItem.itemId }).zone();
        this.prepareGarnishFoodToEdit();
        this.prepareAdditionsToEdit();

        this._showOrderItemDetail = true;
        this.viewItemDetail('addition-detail', true);
        this.viewItemDetail('item-selected', false);
    }

    /**
     * Show order additions detail
     * @param {OrderAddition} _pAdition
     */
    showAdditionsDetail(_pAdition: OrderAddition): void {
        Additions.collection.find({}).fetch().forEach((add) => {
            if (this._additionsDetailFormGroup.contains(add._id)) {
                this._additionsDetailFormGroup.removeControl(add._id);
            }
        });
        let control: FormControl = new FormControl(_pAdition.quantity, [Validators.minLength(1), Validators.maxLength(2)]);
        this._additionsDetailFormGroup.addControl(_pAdition.additionId, control);
        this._additionDetails = Additions.find({ _id: _pAdition.additionId }).zone();
        this.viewItemDetail('item-selected', true);
        this.viewItemDetail('addition-detail', false);
    }

    /**
     * Reset orderItem edition values
     */
    resetEditionValues(): void {
        this._editOrderItemForm.reset();
        this._garnishFormGroup.reset();
        this._additionsFormGroup.reset();
        this._orderItemGarnishFood = [];
        this._orderItemAdditions = [];
        this._quantityCount = 1;
        this._lastQuantity = 1;
    }

    /**
     * When orderItem is in edited mode, this function prepare their garnish food elements
     */
    prepareGarnishFoodToEdit(): void {
        GarnishFoodCol.collection.find({}).fetch().forEach((gar) => {
            let _lGarnishFood: GarnishFood = gar;
            let find = this._orderItemGarnishFood.filter(g => g === _lGarnishFood._id);

            if (find.length > 0) {
                if (this._garnishFormGroup.contains(gar._id)) {
                    this._garnishFormGroup.controls[gar._id].setValue(true);
                } else {
                    let control: FormControl = new FormControl(true);
                    this._garnishFormGroup.addControl(gar._id, control);
                }
            } else {
                if (this._garnishFormGroup.contains(gar._id)) {
                    this._garnishFormGroup.controls[gar._id].setValue(false);
                } else {
                    let control: FormControl = new FormControl(false);
                    this._garnishFormGroup.addControl(gar._id, control);
                }
            }
        });
    }

    /**
     * When orderItem is in edited mode, this function prepare their addition elements
     */
    prepareAdditionsToEdit(): void {
        Additions.collection.find({}).fetch().forEach((add) => {
            let _lAddition: Addition = add;
            let find = this._orderItemAdditions.filter(a => a === _lAddition._id);

            if (find.length > 0) {
                if (this._additionsFormGroup.contains(add._id)) {
                    this._additionsFormGroup.controls[add._id].setValue(true);
                } else {
                    let control: FormControl = new FormControl(true);
                    this._additionsFormGroup.addControl(add._id, control);
                }
            } else {
                if (this._additionsFormGroup.contains(add._id)) {
                    this._additionsFormGroup.controls[add._id].setValue(false);
                } else {
                    let control: FormControl = new FormControl(false);
                    this._additionsFormGroup.addControl(add._id, control);
                }
            }
        });
    }

    /**
     * Set max garnish food elements in order item detail
     * @param {number} _pGarnishFoodQuantity
     */
    setMaxGarnishFoodElements(_pGarnishFoodQuantity: number): void {
        this._maxGarnishFoodElements = _pGarnishFoodQuantity;
    }

    /**
     * Set item unit price
     * @param {number} _pItemPrice
     */
    setUnitPrice(_pItemPrice: Item): void {
        this._unitPrice = this.getItemPrice(_pItemPrice);
    }

    /**
     * Validate Garnish food selections and show message error if count is greater than item.garnishFoodQuantity
     * in order item edition
     */
    validateGarnishFoodElements(): void {
        if (this._garnishFoodElementsCount > this._maxGarnishFoodElements) {
            this._showGarnishFoodError = true;
        } else {
            this._showGarnishFoodError = false;
        }
    }

    /**
     * Return _quantityCount
     */
    get quantityCount(): number {
        return this._quantityCount;
    }

    /**
     * Add quantity item
     */
    addCount(): void {
        this._lastQuantity = this._quantityCount;
        this._quantityCount += 1;
        this.calculateFinalPriceQuantity();
    }

    /**
     * Subtract quantity item
     */
    removeCount(): void {
        if (this._quantityCount > 1) {
            this._lastQuantity = this._quantityCount;
            this._quantityCount -= 1;
        }
        this.calculateFinalPriceQuantity();
    }

    /**
     * Calculate final price when item quantity is entered
     */
    calculateFinalPriceQuantity(): void {
        if (Number.isFinite(this._quantityCount)) {
            this._finalPrice = this._unitPrice * this._quantityCount;
            this._garnishFoodElementsCount = 0;
            this._garnishFormGroup.reset();
            this._additionsFormGroup.reset();
            this._showGarnishFoodError = false;
        }
    }

    /**
     * Calculate final price when garnish food is selected
     * @param {any} _event 
     * @param {number} _price 
     */
    calculateFinalPriceGarnishFood(_event: any, _pGarnishFood: GarnishFood): void {
        let _price = _pGarnishFood.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price;
        if (_event.checked) {
            this._finalPrice = (Number.parseInt(this._finalPrice.toString()) + (Number.parseInt(_price.toString()) * this._quantityCount));
            this._garnishFoodElementsCount += 1;
            this.validateGarnishFoodElements();
        } else {
            this._finalPrice = Number.parseInt(this._finalPrice.toString()) - (Number.parseInt(_price.toString()) * this._quantityCount);
            this._garnishFoodElementsCount -= 1;
            this.validateGarnishFoodElements();
        }
    }

    /**
     * Calculate final price when addition is selected
     * @param {any} _event 
     * @param {number} _price 
     */
    calculateFinalPriceAddition(_event: any, _pAddition: Addition): void {
        let _price = _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price;
        if (_event.checked) {
            this._finalPrice = (Number.parseInt(this._finalPrice.toString()) + (Number.parseInt(_price.toString()) * this._quantityCount));
        } else {
            this._finalPrice = Number.parseInt(this._finalPrice.toString()) - (Number.parseInt(_price.toString()) * this._quantityCount);
        }
    }

    /**
     * Edit OrderItem in current order
     * @param {string} _pItemToInsert
     */
    editOrderItem(_pItemToInsert: string): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        if (this._editOrderItemForm.valid) {
            let arr: any[] = Object.keys(this._editOrderItemForm.value.garnishFood);
            let _lGarnishFoodToInsert: string[] = [];

            arr.forEach((gar) => {
                if (this._editOrderItemForm.value.garnishFood[gar]) {
                    _lGarnishFoodToInsert.push(gar);
                }
            });

            let arrAdd: any[] = Object.keys(this._editOrderItemForm.value.additions);
            let _lAdditionsToInsert: string[] = [];

            arrAdd.forEach((add) => {
                if (this._editOrderItemForm.value.additions[add]) {
                    _lAdditionsToInsert.push(add);
                }
            });

            let _lOrderItem: OrderItem = {
                index: this._orderItemIndex,
                itemId: _pItemToInsert,
                quantity: this._quantityCount,
                observations: this._editOrderItemForm.value.observations,
                garnishFood: _lGarnishFoodToInsert,
                additions: _lAdditionsToInsert,
                paymentItem: this._finalPrice
            };


            let _lOrderItemToremove: OrderItem = this._currentOrder.items.filter(o => _lOrderItem.itemId === o.itemId && _lOrderItem.index === o.index)[0];
            let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderItemToremove.paymentItem;

            Orders.update({ _id: this._currentOrder._id }, { $pull: { items: { itemId: _lOrderItem.itemId, index: _lOrderItem.index } } });
            Orders.update({ _id: this._currentOrder._id },
                {
                    $set: {
                        totalPayment: _lNewTotalPayment,
                        modification_user: this._user,
                        modification_date: new Date()
                    }
                }
            );

            let _lOrder = Orders.findOne({ _id: this._currentOrder._id });
            let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_lOrderItem.paymentItem.toString());

            Orders.update({ _id: _lOrder._id },
                { $push: { items: _lOrderItem } }
            );
            Orders.update({ _id: _lOrder._id },
                {
                    $set: {
                        modification_user: this._user,
                        modification_date: new Date(),
                        totalPayment: _lTotalPaymentAux
                    }
                }
            );
            this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
            this._showOrderItemDetail = false;
            this.viewItemDetail('item-selected', true);
            let _lMessage: string = this.itemNameTraduction('ORDER_LIST.ITEM_EDITED');
            this.snackBar.open(_lMessage, '', {
                duration: 2500
            });
        }
    }

    /**
     * Modify addition in order
     */
    editOrderAddition(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let arrAdd: any[] = Object.keys(this._additionsDetailFormGroup.value);
        let _lOrderAddition: OrderAddition;

        arrAdd.forEach((add) => {
            if (this._additionsDetailFormGroup.value[add]) {
                let _lAddition: Addition = Additions.findOne({ _id: add });
                _lOrderAddition = {
                    additionId: add,
                    quantity: this._additionsDetailFormGroup.value[add],
                    paymentAddition: (this.getAdditionPrice(_lAddition) * (this._additionsDetailFormGroup.value[add]))
                };
            }
        });
        let _lOrderAdditionToremove: OrderAddition = this._currentOrder.additions.filter(ad => ad.additionId === _lOrderAddition.additionId)[0];
        let _lNewTotalPayment: number = this._currentOrder.totalPayment - _lOrderAdditionToremove.paymentAddition;

        Orders.update({ _id: this._currentOrder._id }, { $pull: { additions: { additionId: _lOrderAdditionToremove.additionId } } });
        Orders.update({ _id: this._currentOrder._id },
            {
                $set: {
                    totalPayment: _lNewTotalPayment,
                    modification_user: this._user,
                    modification_date: new Date()
                }
            }
        );
        let _lOrder = Orders.findOne({ _id: this._currentOrder._id });
        let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_lOrderAddition.paymentAddition.toString());

        Orders.update({ _id: _lOrder._id },
            { $push: { additions: _lOrderAddition } }
        );
        Orders.update({ _id: _lOrder._id },
            {
                $set: {
                    modification_user: this._user,
                    modification_date: new Date(),
                    totalPayment: _lTotalPaymentAux
                }
            }
        );
        this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
        this.viewItemDetail('addition-detail', true);

        let _lMessage: string = this.itemNameTraduction('ORDER_LIST.ADDITION_EDITED');
        this.snackBar.open(_lMessage, '', {
            duration: 2500
        });
    }

    /**
     * Return Addition price
     * @param {Addition} _pAddition 
     */
    getAdditionPrice(_pAddition: Addition): number {
        return _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price;
    }

    /**
     * Cancel customer order if the order is in REGISTERED status
     * @param {Order} _pOrder 
     */
    cancelCustomerOrder(_pOrder: Order) {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_LIST.CANCEL_ORDER_DLG'),
                subtitle: '',
                content: this.itemNameTraduction("ORDER_LIST.CANCEL_ORDER_CONFIRM"),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                if (_pOrder.status === 'ORDER_STATUS.SELECTING') {
                    Orders.update({ _id: _pOrder._id }, {
                        $set: {
                            status: 'ORDER_STATUS.CANCELED', modification_user: this._user,
                            modification_date: new Date()
                        }
                    }
                    );
                    this._showDetails = false;
                } else {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction("ORDER_LIST.ORDER_CANT_CANCEL"), '', this.btnAcceptLbl, false);
                }
                this.viewItemDetail('item-selected', true);
            }
        });
    }

    /**
     * Confirm customer order
     * @param {Order} _pOrder 
     */
    confirmCustomerOrder(_pOrder: Order) {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        let _lItemsIsAvailable: boolean = true;
        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_LIST.CONFIRM_ORDER_DLG'),
                subtitle: '',
                content: this.itemNameTraduction("ORDER_LIST.CONFIRM_ORDER_MESSAGE"),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                if (_pOrder.status === 'ORDER_STATUS.SELECTING') {
                    let _lOrderItems: OrderItem[] = _pOrder.items;
                    _lOrderItems.forEach((it) => {
                        let _lItem: Item = Items.findOne({ _id: it.itemId });
                        let aux = _lItem.establishments.find(element => element.establishment_id === this.establishmentId);
                        if (aux.isAvailable === false) {
                            _lItemsIsAvailable = false
                        }
                    });
                    if (_lItemsIsAvailable) {
                        this._showDetails = false;
                        var data: any = {
                            establishments: _pOrder.establishment_id,
                            tables: _pOrder.tableId,
                            user: this._user,
                            waiter_id: "",
                            status: "waiting",
                            type: "CUSTOMER_ORDER",
                            order_id: _pOrder._id
                        }

                        this._loading = true;
                        setTimeout(() => {
                            MeteorObservable.call('findQueueByEstablishment', data).subscribe(() => {
                                Orders.update({ _id: _pOrder._id }, { $set: { status: 'ORDER_STATUS.CONFIRMED', modification_user: this._user, modification_date: new Date() } });
                                this._loading = false;
                                let _lMessage: string = this.itemNameTraduction('ORDER_LIST.ORDER_CONFIRMED_MSG');
                                this.snackBar.open(_lMessage, '', { duration: 2500 });
                            }, (error) => {
                                this.openDialog(this.titleMsg, '', error.reason, '', this.btnAcceptLbl, false);
                            });
                        }, 1500);
                    } else {
                        this.openDialog(this.titleMsg, '', this.itemNameTraduction("ORDER_LIST.ORDER_ITEMS_UNAVAILABLE"), '', this.btnAcceptLbl, false);
                    }
                } else {
                    this.openDialog(this.titleMsg, '', this.itemNameTraduction("ORDER_LIST.ORDER_CANT_CONFIRM"), '', this.btnAcceptLbl, false);
                }
                this.viewItemDetail('item-selected', true);
                this._orderCustomerIndex = -1;
            }
        });
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Return Item price by current establishment
     * @param {Item} _pItem 
     */
    getItemPrice(_pItem: Item): number {
        return _pItem.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price;
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price + ' ';
    }

    /**
     * Return garnish food information
     * @param {GarnishFood} _pGarnishFood
     */
    getGarnishFoodInformation(_pGarnishFood: GarnishFood): string {
        return _pGarnishFood.name + ' - ' + _pGarnishFood.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price + ' ';
    }

    createNewOrderEvent(): void {
        this.createNewOrder.emit(true);
    }

    /**
    * Function to get item avalaibility 
    */
    getItemAvailability(itemId: string): boolean {
        let _itemEstablishment: Item = Items.collection.findOne({ _id: itemId }, { fields: { _id: 0, establishments: 1 } });
        let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this.establishmentId);
        return aux.isAvailable;
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    /**
     * Function to open rewards detail component
     */
    reedemPoints(): void {
        this._mdDialogRef = this._mdDialog.open(RewardsDetailComponent, {
            disableClose: true,
            width: '50%'
        });
        this._mdDialogRef.componentInstance._establishmentId = this.establishmentId;
        this._mdDialogRef.componentInstance._tableQRCode = this.tableQRCode;
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = null;
        });
    }

    /**
     * Open establishment profile detail
     * @param {string} _pEstablishmentId 
     */
    openEstablishmentProfileDetail(_pEstablishmentId: string): void {
        this._router.navigate(['app/establishment-detail', _pEstablishmentId]);
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}