import { Component, OnInit, OnDestroy, Input, NgZone, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar, MatDialogRef, MatDialog } from '@angular/material';
import { Router } from "@angular/router";
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Order, OrderItem, OrderAddition, OptionReference, ValueReference, OrderOption } from '../../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../../both/collections/establishment/order.collection';
import { Item } from '../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../both/collections/menu/item.collection';
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
import { UserDetail, UserRewardPoints } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { RewardPoints } from '../../../../../../../both/collections/establishment/reward-point.collection';
import { Option } from '../../../../../../../both/models/menu/option.model';
import { Options } from '../../../../../../../both/collections/menu/option.collection';
import { OptionValue } from '../../../../../../../both/models/menu/option-value.model';
import { OptionValues } from '../../../../../../../both/collections/menu/option-value.collection';
import { EstablishmentPoint } from '../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../both/collections/points/establishment-points.collection';
import { NegativePoint } from '../../../../../../../both/models/points/negative-point.model';
import { NegativePoints } from '../../../../../../../both/collections/points/negative-points.collection';

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
    private _additionsSub: Subscription;
    private _currenciesSub: Subscription;
    private _establishmentSub: Subscription;
    private _tablesSub: Subscription;
    private _rewardsSub: Subscription;
    private _userDetailsSub: Subscription;
    private _rewardPointsSub: Subscription;
    private _optionSub: Subscription;
    private _optionValuesSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private _negativePointsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _mdDialogRef: MatDialogRef<any>;

    private _orders: Observable<Order[]>;
    private _ordersTable: Observable<Order[]>;
    private _items: Observable<Item[]>;
    private _itemsToShowDetail: Observable<Item[]>;
    private _additions: Observable<Addition[]>;
    private _additionDetails: Observable<Addition[]>;
    private _establishments: Observable<Establishment[]>;
    private _rewards: Observable<Reward[]>;
    private _userDetails: Observable<UserDetail[]>;
    private _options: Observable<Option[]>;
    private _optionValues: Observable<OptionValue[]>;

    private _showOrderItemDetail: boolean = false;
    private _currentOrder: Order;
    private _customerCanEdit: boolean = false;
    private _showDetails: boolean = false;

    private _editOrderItemForm: FormGroup;
    private _optionsFormGroup: FormGroup = new FormGroup({});
    private _additionsFormGroup: FormGroup = new FormGroup({});
    private _additionsDetailFormGroup: FormGroup = new FormGroup({});

    private _orderItemAdditions: string[] = [];
    private _orderItemOptions: OrderOption[] = [];
    private _radioReferences: OptionReference[] = [];
    private _showOptionsError: boolean = false;

    private _lastQuantity: number = 1;
    private _quantityCount: number = 1;
    private _finalPrice: number = 0;
    private _unitPrice: number = 0;
    private _orderItemIndex: number = -1;
    private _currencyCode: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private _initialValue = 'all';
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
    private _userRewardPoints: number = 0;

    private _finalPoints: number = 0;
    private _unitRewardPoints: number = 0;

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
        let _optionIds: string[] = [];
        this.removeSubscriptions();
        this._ordersSub = MeteorObservable.subscribe('getOrders', this.establishmentId, this.tableQRCode, ['ORDER_STATUS.SELECTING', 'ORDER_STATUS.CONFIRMED']).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this.countUserOrders();
                this._orders = Orders.find({ creation_user: this._user }).zone();
                this._orders.subscribe(() => { this.countUserOrders(); });
                this.countNotUserOrders();
                this._ordersTable = Orders.find({ creation_user: { $not: this._user } }).zone();
                this._ordersTable.subscribe(() => { this.countNotUserOrders(); });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({}).zone();
            });
        });

        this._showOrderItemDetail = false;

        this._editOrderItemForm = new FormGroup({
            observations: new FormControl('', [Validators.maxLength(50)]),
            options: this._optionsFormGroup,
            additions: this._additionsFormGroup
        });

        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({}).zone();
            });
        });
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this.establishmentId]).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._currencyCode = Currencies.findOne({ _id: this.establishmentCurrency }).code + ' ';
            });
        });
        this._establishmentSub = MeteorObservable.subscribe('getEstablishmentById', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this.establishmentId }).zone();
            });
        });
        this._tablesSub = MeteorObservable.subscribe('getTableByQRCode', this.tableQRCode).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._tableNumber = Tables.collection.findOne({ QR_code: this.tableQRCode })._number;
            });
        });
        this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [this.establishmentId] } }, { sort: { points: 1 } }).zone();
                this.countRewards();
                this._rewards.subscribe(() => { this.countRewards(); });
            });
        });
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._userDetails = UserDetails.find({}).zone();
                this.verifyUserRewardPoints();
                this._userDetails.subscribe(() => { this.verifyUserRewardPoints(); });
            });
        });
        this._rewardPointsSub = MeteorObservable.subscribe('getRewardPointsByUserId', this._user).takeUntil(this._ngUnsubscribe).subscribe();

        this._optionSub = MeteorObservable.subscribe('optionsByEstablishment', [this.establishmentId]).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._options = Options.find({ establishments: { $in: [this.establishmentId] }, is_active: true }).zone();
                this._options.subscribe(() => {
                    Options.find({ establishments: { $in: [this.establishmentId] }, is_active: true }).fetch().forEach((opt) => {
                        _optionIds.push(opt._id);
                    });
                    this._optionValuesSub = MeteorObservable.subscribe('getOptionValuesByOptionIds', _optionIds).takeUntil(this._ngUnsubscribe).subscribe(() => {
                        this._ngZone.run(() => {
                            this._optionValues = OptionValues.find({ option_id: { $in: _optionIds }, is_active: true }).zone();
                        });
                    });
                });
            });
        });
        this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds',[this.establishmentId]).takeUntil(this._ngUnsubscribe).subscribe();
        this._negativePointsSub = MeteorObservable.subscribe('getNegativePointsByEstablishmentId', this.establishmentId).takeUntil(this._ngUnsubscribe).subscribe();
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
        Rewards.collection.find({ establishments: { $in: [this.establishmentId] } }, { sort: { points: 1 } }).count() > 0 ? this._showReedemPoints = true : this._showReedemPoints = false;
    }

    /**
     * Verify user reward points
     */
    verifyUserRewardPoints(): void {
        let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: this._user });
        if (_lUserDetail) {
            let _lRewardPoints: UserRewardPoints[] = _lUserDetail.reward_points;

            if (_lRewardPoints) {
                if (_lRewardPoints.length > 0) {
                    let _lPoints: UserRewardPoints = _lUserDetail.reward_points.filter(p => p.establishment_id === this.establishmentId)[0];
                    if (_lPoints) {
                        this._userRewardPoints = _lPoints.points;
                    } else {
                        this._userRewardPoints = 0;
                    }
                } else {
                    this._userRewardPoints = 0;
                }
            }
        }
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
                let _lNewTotalPoints: number = Number.parseInt(this._currentOrder.total_reward_points.toString()) - Number.parseInt(_lOrderItemToremove.reward_points.toString());

                Orders.update({ _id: this._currentOrder._id }, { $pull: { items: { itemId: _pItemId, index: this._orderItemIndex } } });
                Orders.update({ _id: this._currentOrder._id },
                    {
                        $set: {
                            totalPayment: _lNewTotalPayment,
                            total_reward_points: _lNewTotalPoints,
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
        this._orderItemAdditions = _pOrderItem.additions;
        this._orderItemOptions = _pOrderItem.options;
        this._finalPrice = _pOrderItem.paymentItem;
        this._finalPoints = _pOrderItem.reward_points;

        this._itemsToShowDetail = Items.find({ _id: _pOrderItem.itemId }).zone();

        let _lItem: Item = Items.findOne({ _id: _pOrderItem.itemId });
        this.prepareOptionsToEdit();
        this.createOptionsReferences(_lItem, true);
        this.prepareAdditionsToEdit();
        this._showOptionsError = false;

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
        this._optionsFormGroup.reset();
        this._additionsFormGroup.reset();
        this._orderItemOptions = [];
        this._orderItemAdditions = [];
        this._quantityCount = 1;
        this._lastQuantity = 1;
    }

    /**
     * Create radio button options references
     * @param {Item} _pItem 
     */
    createOptionsReferences(_pItem: Item, _pValidateInitialOptions: boolean): void {
        this._radioReferences = [];
        _pItem.options.forEach((item_option) => {
            let _reference: OptionReference = { option_id: '', is_required: false, values: [] };
            let _valuesRef: ValueReference[] = [];
            _reference.option_id = item_option.option_id;
            _reference.is_required = item_option.is_required;
            item_option.values.forEach((item_option_value) => {
                let _value: ValueReference = { value_id: item_option_value.option_value_id, price: 0, in_use: false };
                if (item_option_value.have_price) {
                    _value.price = item_option_value.price;
                }
                if (_pValidateInitialOptions) {
                    let _lOrderItemOption: OrderOption = this._orderItemOptions.find(op => op.value_id === item_option_value.option_value_id);
                    if (_lOrderItemOption) {
                        _value.in_use = true;
                        this._optionsFormGroup.controls[_lOrderItemOption.option_id].setValue(true);
                    }
                }
                _valuesRef.push(_value);
            });
            _reference.values = _valuesRef;
            this._radioReferences.push(_reference);
        });
    }

    /**
     * Build controls in option form
     */
    prepareOptionsToEdit(): void {
        Options.collection.find({ establishments: { $in: [this.establishmentId] }, is_active: true }).fetch().forEach((opt) => {
            if (this._optionsFormGroup.contains(opt._id)) {
                this._optionsFormGroup.controls[opt._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._optionsFormGroup.addControl(opt._id, control);
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
     * Set item unit price
     * @param {number} _pItemPrice
     */
    setUnitPrice(_pItemPrice: Item): void {
        this._unitPrice = this.getItemPrice(_pItemPrice);
        this._unitRewardPoints = this.getItemRewardPoints(_pItemPrice);
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
    addCount(_pItem: Item): void {
        this._lastQuantity = this._quantityCount;
        this._quantityCount += 1;
        this.calculateFinalPriceQuantity(_pItem);
        this.calculateFinalPointsQuantity();
    }

    /**
     * Subtract quantity item
     */
    removeCount(_pItem: Item): void {
        if (this._quantityCount > 1) {
            this._lastQuantity = this._quantityCount;
            this._quantityCount -= 1;
        }
        this.calculateFinalPriceQuantity(_pItem);
        this.calculateFinalPointsQuantity();
    }

    /**
     * Calculate final price when item quantity is entered
     */
    calculateFinalPriceQuantity(_pItem: Item): void {
        if (Number.isFinite(this._quantityCount)) {
            this._finalPrice = this._unitPrice * this._quantityCount;
            this.createOptionsReferences(_pItem, false);
            this._optionsFormGroup.reset();
            this._additionsFormGroup.reset();
        }
    }

    /**
     * Calculate final points when item quantity is entered
     */
    calculateFinalPointsQuantity(): void {
        if (Number.isFinite(this._quantityCount)) {
            this._finalPoints = this._unitRewardPoints * this._quantityCount;
        }
    }

    /**
     * Calculate final price when option value is selected
     * @param {string} _pOptionId 
     * @param {any} _pEvent 
     */
    calculateFinalPriceOptionValue(_pOptionId: string, _pEvent: any): void {
        let _lReference: OptionReference = this._radioReferences.find(reference => reference.option_id === _pOptionId);
        _lReference.values.forEach((value) => {
            if (value.in_use) {
                this._finalPrice = this._finalPrice - (value.price * this._quantityCount);
                value.in_use = false;
            }
            if (_pEvent.value === value.value_id) {
                this._finalPrice = this._finalPrice + (value.price * this._quantityCount);
                value.in_use = true;
            }
        });
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

        this._radioReferences.forEach((option) => {
            if (option.is_required) {
                let valid: ValueReference[] = option.values.filter(val => val.in_use === true);
                if (valid.length === 0) {
                    this._showOptionsError = true;
                } else {
                    this._showOptionsError = false;
                }
            }
        });

        if (this._editOrderItemForm.valid && !this._showOptionsError) {
            let _arrOption: any[] = Object.keys(this._editOrderItemForm.value.options);
            let _lOptionsToInsert: OrderOption[] = [];

            _arrOption.forEach((opt) => {
                if (this._editOrderItemForm.value.options[opt]) {
                    let _lOrderOption: OrderOption = { option_id: opt, value_id: '' };
                    let _reference: OptionReference = this._radioReferences.find(ref => ref.option_id === opt);
                    _reference.values.forEach((val) => {
                        if (val.in_use) {
                            _lOrderOption.value_id = val.value_id;
                        }
                    });
                    _lOptionsToInsert.push(_lOrderOption);
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
                options: _lOptionsToInsert,
                additions: _lAdditionsToInsert,
                paymentItem: this._finalPrice,
                reward_points: this._finalPoints
            };


            let _lOrderItemToremove: OrderItem = this._currentOrder.items.filter(o => _lOrderItem.itemId === o.itemId && _lOrderItem.index === o.index)[0];
            let _lNewTotalPayment: number = Number.parseInt(this._currentOrder.totalPayment.toString()) - Number.parseInt(_lOrderItemToremove.paymentItem.toString());
            let _lNewTotalPoints: number = Number.parseInt(this._currentOrder.total_reward_points.toString()) - Number.parseInt(_lOrderItemToremove.reward_points.toString());

            Orders.update({ _id: this._currentOrder._id }, { $pull: { items: { itemId: _lOrderItem.itemId, index: _lOrderItem.index } } });
            Orders.update({ _id: this._currentOrder._id },
                {
                    $set: {
                        totalPayment: _lNewTotalPayment,
                        total_reward_points: _lNewTotalPoints,
                        modification_user: this._user,
                        modification_date: new Date()
                    }
                }
            );

            let _lOrder = Orders.findOne({ _id: this._currentOrder._id });
            let _lTotalPaymentAux: number = Number.parseInt(_lOrder.totalPayment.toString()) + Number.parseInt(_lOrderItem.paymentItem.toString());
            let _lTotalPointsAux: number = Number.parseInt(_lOrder.total_reward_points.toString()) + Number.parseInt(_lOrderItem.reward_points.toString());

            Orders.update({ _id: _lOrder._id },
                { $push: { items: _lOrderItem } }
            );
            Orders.update({ _id: _lOrder._id },
                {
                    $set: {
                        modification_user: this._user,
                        modification_date: new Date(),
                        totalPayment: _lTotalPaymentAux,
                        total_reward_points: _lTotalPointsAux
                    }
                }
            );
            this._currentOrder = Orders.findOne({ _id: this._currentOrder._id });
            this._showOrderItemDetail = false;
            this._showOptionsError = false;
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
                    _pOrder.items.forEach((it) => {
                        if (it.is_reward) {
                            let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: _pOrder.creation_user });
                            let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _pOrder.establishment_id)[0];
                            let _lNewPoints: number = Number.parseInt(_lPoints.points.toString()) + Number.parseInt(it.redeemed_points.toString());

                            UserDetails.update({ _id: _lConsumerDetail._id }, { $pull: { reward_points: { establishment_id: _pOrder.establishment_id } } });
                            UserDetails.update({ _id: _lConsumerDetail._id }, { $push: { reward_points: { index: _lPoints.index, establishment_id: _pOrder.establishment_id, points: _lNewPoints } } });

                            let _lRedeemedPoints: number = it.redeemed_points;
                            let _lValidatePoints: boolean = true;
                            RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: _pOrder.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                                if (_lValidatePoints) {
                                    if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                                        let aux: number = pnt.points - pnt.difference;
                                        _lRedeemedPoints = _lRedeemedPoints - aux;
                                        RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                                    } else if (!pnt.is_active) {
                                        _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                                        RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                                        if (_lRedeemedPoints === 0) {
                                            _lValidatePoints = false;
                                        }
                                    }
                                }
                            });

                            let _establishmentPoints: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pOrder.establishment_id });
                            let _negativePoints: NegativePoint = NegativePoints.findOne({ establishment_id: _pOrder.establishment_id, order_id: _pOrder._id, user_id: _pOrder.creation_user });

                            if (_negativePoints) {
                                NegativePoints.update({ _id: _negativePoints._id }, { $set: { was_cancelled: true } });
                                let _newPoints: number = Number.parseInt(_establishmentPoints.current_points.toString()) + Number.parseInt(_negativePoints.redeemed_points.toString());
                                if (_newPoints >= 0) {
                                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _newPoints, negative_balance: false } });
                                } else {
                                    EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _newPoints, negative_balance: true } });
                                }
                            } else {
                                let _pointsResult: number = Number.parseInt(_establishmentPoints.current_points.toString()) + Number.parseInt(it.redeemed_points.toString());
                                EstablishmentPoints.update({ _id: _establishmentPoints._id }, { $set: { current_points: _pointsResult, negative_balance: false } });
                            }
                        }
                    });

                    Orders.update({ _id: _pOrder._id }, {
                        $set: {
                            status: 'ORDER_STATUS.CANCELED', modification_user: this._user,
                            modification_date: new Date()
                        }
                    }
                    );
                    this._showDetails = false;
                    let _lMessage: string = this.itemNameTraduction('ORDER_LIST.CANCEL_ORDER_MSG');
                    this.snackBar.open(_lMessage, '', { duration: 2500 });
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
     * Return Item rewardPoints
     * @param {Item} _pItem
     */
    getItemRewardPoints(_pItem: Item): number {
        return Number.parseInt(_pItem.reward_points.toString());
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this.establishmentId)[0].price + ' ';
    }

    /**
     * Create new order event
     */
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
        });
        this._mdDialogRef.componentInstance._establishmentId = this.establishmentId;
        this._mdDialogRef.componentInstance._tableQRCode = this.tableQRCode;
        this._mdDialogRef.componentInstance._userRewardPoints = this._userRewardPoints;
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = null;
        });
    }

    /**
     * Function to remove reward from consumer order
     * @param {Order} _pOrder 
     * @param {string} _pItemId 
     * @param {number} _pIndex 
     */
    removeReward(_pOrder: Order, _pItemId: string, _pIndex: number): void {
        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: this.itemNameTraduction('ORDER_LIST.REMOVE_REWARD'),
                subtitle: '',
                content: this.itemNameTraduction("ORDER_LIST.REMOVE_REWARD_MSG"),
                buttonCancel: this.itemNameTraduction('NO'),
                buttonAccept: this.itemNameTraduction('YES'),
                showCancel: true
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                let _lOrderItemToremove: OrderItem = _pOrder.items.filter(o => _pItemId === o.itemId && o.index === _pIndex && o.is_reward)[0];
                let _lNewTotalPayment: number = _pOrder.totalPayment - _lOrderItemToremove.paymentItem;

                Orders.update({ _id: _pOrder._id }, { $pull: { items: { itemId: _pItemId, index: _pIndex } } });
                Orders.update({ _id: _pOrder._id },
                    {
                        $set: {
                            totalPayment: _lNewTotalPayment,
                            modification_user: this._user,
                            modification_date: new Date()
                        }
                    }
                );

                let _lConsumerDetail: UserDetail = UserDetails.findOne({ user_id: _pOrder.creation_user });
                let _lPoints: UserRewardPoints = _lConsumerDetail.reward_points.filter(p => p.establishment_id === _pOrder.establishment_id)[0];
                let _lNewPoints: number = Number.parseInt(_lPoints.points.toString()) + Number.parseInt(_lOrderItemToremove.redeemed_points.toString());

                UserDetails.update({ _id: _lConsumerDetail._id }, { $pull: { reward_points: { establishment_id: _pOrder.establishment_id } } });
                UserDetails.update({ _id: _lConsumerDetail._id }, { $push: { reward_points: { index: _lPoints.index, establishment_id: _pOrder.establishment_id, points: _lNewPoints } } });

                let _lRedeemedPoints: number = _lOrderItemToremove.redeemed_points;
                let _lValidatePoints: boolean = true;
                RewardPoints.collection.find({ id_user: Meteor.userId(), establishment_id: _pOrder.establishment_id }, { sort: { gain_date: -1 } }).fetch().forEach((pnt) => {
                    if (_lValidatePoints) {
                        if (pnt.difference !== null && pnt.difference !== undefined && pnt.difference !== 0) {
                            let aux: number = pnt.points - pnt.difference;
                            _lRedeemedPoints = _lRedeemedPoints - aux;
                            RewardPoints.update({ _id: pnt._id }, { $set: { difference: 0 } });
                        } else if (!pnt.is_active) {
                            _lRedeemedPoints = _lRedeemedPoints - pnt.points;
                            RewardPoints.update({ _id: pnt._id }, { $set: { is_active: true } });
                            if (_lRedeemedPoints === 0) {
                                _lValidatePoints = false;
                            }
                        }
                    }
                });

                this._currentOrder = Orders.findOne({ _id: _pOrder._id });
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
                let _lMessage: string = this.itemNameTraduction('ORDER_LIST.REWARD_DELETED');
                this.snackBar.open(_lMessage, '', { duration: 2500 });
            }
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