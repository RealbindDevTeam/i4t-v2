import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Item } from 'i4t_web/both/models/menu/item.model';
import { Currencies } from 'i4t_web/both/collections/general/currency.collection';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Subject } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Items } from 'i4t_web/both/collections/menu/item.collection';

@Component({
  selector: 'item-card',
  templateUrl: 'item-card.html'
})

export class ItemCardComponent implements OnInit, OnDestroy {

  @Input()
  itemIdIn: Item;

  @Input()
  resCode: string;

  @Output()
  itemIdOut: EventEmitter<string> = new EventEmitter<string>();

  private _currenciesSub: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();
  private _currencyCode: string;


  constructor(public _translate: TranslateService,
    private _userLanguageService: UserLanguageServiceProvider) {
    _translate.setDefaultLang('en');
  }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this.resCode]).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._currencyCode = Currencies.collection.find({}).fetch()[0].code + ' ';
    });
  }

  getItemThumb(_itemId: string): string {
    let _item = Items.findOne({ _id: _itemId });
    if (_item) {
      if (_item.image) {
        return _item.image.url;
      } else {
        return 'assets/img/default-plate.png';
      }
    } else {
      return 'assets/img/default-plate.png';
    }
  }

  goToDetail(_itemId: string) {
    this.itemIdOut.emit(_itemId);
  }

  /**
   * Return Item price by current establishment
   * @param {Item} _pItem 
   */
  getItemPrice(_pItem: Item): number {
    return _pItem.establishments.filter(r => r.establishment_id === this.resCode)[0].price;
  }

  /**
  * Function to get item avalaibility 
  */
  getItemAvailability(): boolean {
    let _itemEstablishment = this.itemIdIn;
    let aux = _itemEstablishment.establishments.find(element => element.establishment_id === this.resCode);
    return aux.isAvailable;
  }

  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}