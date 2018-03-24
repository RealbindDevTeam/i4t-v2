import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { OrderMenu } from '../../customer/orders/order-navigation/order-menu';

@Injectable()
export class OrderNavigationService {

    private orderMenuSetup: OrderMenu [] = [];
    private _orderMenus: Subject<OrderMenu[]> = new BehaviorSubject( this.orderMenuSetup );

    constructor(){

    }

    public get orderMenus(): Subject<OrderMenu[]> {
        return this._orderMenus;
    }

    public setOrderMenus( _pOrderMenus: OrderMenu[] ): void {
        this._orderMenus.next( _pOrderMenus );
    }

    public addOrderMenu( _pOrderMenu: OrderMenu, index: number = -1 ): void {
        this._orderMenus.take(1).subscribe( _lOrderMenus => {
            if( _lOrderMenus.indexOf( this.findOrderMenu( _pOrderMenu, _lOrderMenus ) ) < 0 ) {
                if( index < 0 ) {
                    _lOrderMenus.push( _pOrderMenu );
                } else {
                    _lOrderMenus.splice( index, 0, _pOrderMenu );
                }
                this._orderMenus.next(_lOrderMenus);
            }
        });
    }

    public addOrderMenus( _pOrderMenus: OrderMenu[] ): void {
        for ( let menu of _pOrderMenus ) {
            this.addOrderMenu( menu ) ;
        }
    }

    public removeOrderMenu( _pOrderMenu: OrderMenu ): void {
        this._orderMenus.take(1).subscribe( _lOrderMenus => {
            let index = _lOrderMenus.indexOf( this.findOrderMenu( _pOrderMenu, _lOrderMenus ) );
            if( index >= 0 ) {
                let newOrderMenus: OrderMenu[] = [..._lOrderMenus.slice( 0, index ), ..._lOrderMenus.slice( index + 1 ) ];
                this._orderMenus.next( newOrderMenus );
            }
        });
    }

    public removeOrderMenus( _pOrderMenus: OrderMenu[] ): void {
        for ( let menu of _pOrderMenus ) {
            this.removeOrderMenu( menu );
        }
    }

    public findOrderMenu( _pIurestId: string | OrderMenu, _pItems: OrderMenu[] ): OrderMenu {
        let _lOrderMenu: OrderMenu = null;
        for ( let i = 0; i < _pItems.length; i++ ) {
            if( _pIurestId instanceof OrderMenu ) {
                if( _pItems[i].iurestId === ( <OrderMenu>_pIurestId ).iurestId && _pItems[i].title === ( <OrderMenu>_pIurestId ).title) {
                    _lOrderMenu = _pItems[i];
                    break;
                } else if( _pItems[i].children.length > 0 ) {
                    _lOrderMenu = this.findOrderMenu( _pIurestId, _pItems[i].children );
                    if( _lOrderMenu !== null ) {
                        break;
                    }
                }
            } else {
                if( _pItems[i].iurestId === <string>_pIurestId ) {
                    _lOrderMenu = _pItems[i];
                    break;
                } else if( _pItems[i].children.length > 0 ) {
                    _lOrderMenu = this.findOrderMenu( _pIurestId, _pItems[i].children );
                    if( _lOrderMenu !== null ) {
                        break;
                    }
                }
            }
        }
        return _lOrderMenu;
    }
}