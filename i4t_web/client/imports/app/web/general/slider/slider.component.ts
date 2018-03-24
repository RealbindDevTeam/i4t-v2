import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector:'iu-slider',
    templateUrl: './slider.component.html',
    styleUrls: [ './slider.component.scss' ]
})
export class IurestSliderComponent {

    @Input() percentageValue: number;
    @Input() label: string;
    @Input() minValue: number;
    @Input() maxValue: number;
    @Input() stepValue: number;    

    @Output() sliderValue = new EventEmitter();

    /**
     * Get percentage value from slider
     * @param {any} _event 
     */
    onPercentageChange( _event:any ):void{
        this.percentageValue = Number( Number( _event ).toFixed( 2 ) );
        this.sliderValue.emit( ( this.percentageValue ) );
    }
}