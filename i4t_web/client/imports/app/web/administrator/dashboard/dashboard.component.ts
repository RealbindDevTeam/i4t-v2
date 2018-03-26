import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { Tables } from '../../../../../../both/collections/establishment/table.collection';
import { Items } from '../../../../../../both/collections/menu/item.collection';
import { Order, OrderItem, OrderAddition } from '../../../../../../both/models/establishment/order.model';
import { Orders } from '../../../../../../both/collections/establishment/order.collection';
import { Currency } from '../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../both/collections/general/currency.collection';
import { EstablishmentPoint } from '../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../both/collections/points/establishment-points.collection';
import { Chart } from 'angular-highcharts';

@Component({
  selector: 'admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private _user = Meteor.userId();

  private _establishments: Observable<Establishment[]>;

  private _establishmentsSub: Subscription;
  private _userDetailsSub: Subscription;
  private _tablesSub: Subscription;
  private _itemsSub: Subscription;
  private _ordersSub: Subscription;
  private _currenciesSub: Subscription;
  private _establishmentPointsSub: Subscription;
  private _ngUnsubscribe: Subject<void> = new Subject<void>();

  private _currentDate: Date = new Date();
  private _currentDay: number = this._currentDate.getDate();
  private _currentMonth: number = this._currentDate.getMonth();
  private _currentYear: number = this._currentDate.getFullYear();
  private _thereAreEstablishments: boolean = true;
  private show: boolean = false;
  /**
   * DashboardComponent Constructor
   * @param {TranslateService} _translate 
   * @param {NgZone} _ngZone 
   * @param {Router} _router
   * @param {UserLanguageService} _userLanguageService
   */
  constructor(private _translate: TranslateService,
    private _ngZone: NgZone,
    private _router: Router,
    private _userLanguageService: UserLanguageService) {
    _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    _translate.setDefaultLang('en');
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit() {
    this.removeSubscriptions();
    let _lEstablishmentsId: string[] = [];
    this._establishmentsSub = MeteorObservable.subscribe('getActiveEstablishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._establishments = Establishments.find({}).zone();
        this.countResturants();
        this._establishments.subscribe(() => { this.countResturants(); });
        Establishments.collection.find({}).fetch().forEach((establishment: Establishment) => {
          _lEstablishmentsId.push(establishment._id);
        });
        this._userDetailsSub = MeteorObservable.subscribe('getUsersByEstablishmentsId', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
        this._itemsSub = MeteorObservable.subscribe('getItemsByEstablishmentIds', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
        this._ordersSub = MeteorObservable.subscribe('getOrdersByEstablishmentIds', _lEstablishmentsId, ['ORDER_STATUS.RECEIVED']).takeUntil(this._ngUnsubscribe).subscribe();
        this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
      });
    });
    this._tablesSub = MeteorObservable.subscribe('tables', this._user).takeUntil(this._ngUnsubscribe).subscribe();
  }

  /**
   * Validate if establishments exists
   */
  countResturants(): void {
    Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  /**
   * Get Users in establishment
   * @param {string} _pEstablishmentId
   */
  getEstablishmentUsers(_pEstablishmentId: string): number {
    return UserDetails.collection.find({ current_establishment: _pEstablishmentId }).count();
  }

  /**
   * Get Tables with Free Status
   * @param {string} _pEstablishmentId 
   */
  getTablesWithFreeStatus(_pEstablishmentId: string): number {
    return Tables.collection.find({ establishment_id: _pEstablishmentId, status: 'FREE' }).count();
  }

  /**
   * Get Tables With Busy Status
   * @param {string} _pEstablishmentId 
   */
  getTablesWithBusyStatus(_pEstablishmentId: string): number {
    return Tables.collection.find({ establishment_id: _pEstablishmentId, status: 'BUSY' }).count();
  }

  /**
   * Get Establishment Points
   * @param {string} _pEstablishmentId 
   */
  getEstablishmentPoints(_pEstablishmentId: string): number {
    let _establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pEstablishmentId });
    if (_establishmentPoint) {
      return _establishmentPoint.current_points;
    } else {
      return 0;
    }
  }

  /**
   * Get available items
   * @param {string} _pEstablishmentId 
   */
  getAvailableItems(_pEstablishmentId: string): number {
    return Items.collection.find({ 'establishments.establishment_id': _pEstablishmentId, 'establishments.isAvailable': true }).count();
  }

  /**
   * Get not available items
   * @param {string} _pEstablishmentId
   */
  getNotAvailableItems(_pEstablishmentId: string): number {
    return Items.collection.find({ 'establishments.establishment_id': _pEstablishmentId, 'establishments.isAvailable': false }).count();
  }

  /**
   * Get daily sales
   * @param {string} _pEstablishmentId
   */
  getDailySales(_pEstablishmentId: string): number {
    let _lTotalSale: number = 0;
    /*Payments.collection.find({ establishment_id: _pEstablishmentId, creation_date: { $gte: new Date(this._currentYear, this._currentMonth, this._currentDay) } }).forEach(function <Payment>(pay, index, ar) {
      _lTotalSale += pay.totalToPayment;
    });*/
    return _lTotalSale;
  }

  /**
   * Get Items Sold
   * @param {string} _pEstablishmentId
   */
  getItemsSold(_pEstablishmentId: string): number {
    let _lAggregate: number = 0;
    let _lToday: Date = new Date();
    Orders.collection.find({
      establishment_id: _pEstablishmentId,
      'creation_date': {
        $gte: new Date(_lToday.getFullYear(), _lToday.getMonth(), _lToday.getDate())
      }
    }).fetch().forEach((order) => {
      order.items.forEach((itemObject) => {
        _lAggregate = _lAggregate + itemObject.quantity;
      });

    });
    return _lAggregate;
  }

  /**
  * Go to charts detail by restaurant
  * @param _pEstablishmentId 
  */
  goToItemUnitsCharts(_pEstablishmentId: string) {
    this._router.navigate(['/app/item-units-chart', _pEstablishmentId], { skipLocationChange: true });
  }

  /**
   * Go to item history chart
   * @param _pEstablishmentId
   */
  goToItemHistoryChart(_pEstablishmentId: string) {
    this._router.navigate(['/app/item-history-chart', _pEstablishmentId], { skipLocationChange: true });
  }

  /**
   * Go to rewards history chart
   * @param _pEstablishmentId
   */
  goToRewardUnitsCharts(_pEstablishment: string) {
    this._router.navigate(['/app/reward-units-chart', _pEstablishment], { skipLocationChange: true });
  }

  /**
   * Go to rewards history chart
   * @param _pEstablishmentId
   */
  goToRewardHistoryCharts(_pEstablishment: string) {
    this._router.navigate(['/app/reward-history-chart', _pEstablishment], { skipLocationChange: true });
  }

  /**
   * Get GarnishFood Sold
   * @param {string} _pEstablishmentId
   */
  /*
  getGarnishFoodSold(_pEstablishmentId: string): number {
    let _lGarnishFoodCount: number = 0;
    Payments.collection.find({ establishment_id: _pEstablishmentId, creation_date: { $gte: new Date(this._currentYear, this._currentMonth, this._currentDay) } }).forEach(function <Payment>(pay, index, ar) {
      pay.orders.forEach((orderId) => {
        let _lOrder: Order = Orders.findOne({ _id: orderId });
        if (_lOrder) {
          _lOrder.items.forEach((orderItem: OrderItem) => {
            _lGarnishFoodCount += (orderItem.quantity * orderItem.garnishFood.length);
          });
        }
      });
    });
    return _lGarnishFoodCount;
  }
  */

  /**
   * Get Additions Sold
   * @param {string} _pEstablishmentId
   */
  /*
  getAdditionsSold(_pEstablishmentId: string): number {
    let _lAdditions: number = 0;
    Payments.collection.find({ establishment_id: _pEstablishmentId, creation_date: { $gte: new Date(this._currentYear, this._currentMonth, this._currentDay) } }).forEach(function <Payment>(pay, index, ar) {
      pay.orders.forEach((orderId) => {
        let _lOrder: Order = Orders.findOne({ _id: orderId });
        if (_lOrder) {
          _lOrder.items.forEach((orderItem: OrderItem) => {
            _lAdditions += (orderItem.quantity * orderItem.additions.length);
          });
          _lOrder.additions.forEach((orderAddition: OrderAddition) => {
            _lAdditions += orderAddition.quantity;
          });
        }
      });
    });
    return _lAdditions;
  }
  */

  /**
   * Get Establishment Currency
   * @param {string} _pCurrencyId 
   */
  getEstablishmentCurrency(_pCurrencyId: string): string {
    let _lCurrency: Currency = Currencies.collection.findOne({ _id: _pCurrencyId });
    if (_lCurrency) {
      return _lCurrency.code;
    }
  }

  /**
   * Go to add new Establishment
   */
  goToAddEstablishment() {
    this._router.navigate(['/app/establishment-register']);
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }
}
