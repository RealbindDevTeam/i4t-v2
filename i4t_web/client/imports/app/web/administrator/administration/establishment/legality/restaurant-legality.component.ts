import { Component, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';

@Component({
    selector: 'restaurant-legality',
    templateUrl: './restaurant-legality.component.html',
    styleUrls: [ './restaurant-legality.component.scss' ]
})
export class RestaurantLegalityComponent {

    @Input() countryId: string;
    @Input() restaurantId: string;
    @Output() restaurantLegality = new EventEmitter();
    @Output() previous = new EventEmitter(); 
    @Output() cancel = new EventEmitter(); 

    /**
     * RestaurantLegality Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor( private _translate: TranslateService,
                 private _userLanguageService: UserLanguageService ) {
        _translate.use( this._userLanguageService.getLanguage( Meteor.user() ) );
        _translate.setDefaultLang( 'en' );
    }

    /**
     * Receive restaurant legality
     * @param {Object} _restaurantLegality 
     */
    setRestaurantLegality( _restaurantLegality: Object ):void {
        this.restaurantLegality.emit( _restaurantLegality );
    }

    /**
     * Emit action to come back in tabs
     * @param {boolean} _previous 
     */
    setPrevious( _previous: boolean ):void{
        this.previous.emit( _previous );
    }

    /**
     * Emit action to cancel edition
     * @param {boolean} _cancel 
     */
    setCancel( _cancel: boolean ):void{
        this.cancel.emit( _cancel );
    }
}