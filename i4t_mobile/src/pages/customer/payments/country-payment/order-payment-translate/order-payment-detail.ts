import { Component, Input } from '@angular/core';
import { AlertController, LoadingController, ToastController } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Order } from 'i4t_web/both/models/establishment/order.model';
import { Orders } from 'i4t_web/both/collections/establishment/order.collection';

@Component({
	selector: 'order-payment-detail',
	templateUrl: 'order-payment-detail.html'
})

export class OrderPaymentDetailComponent {
    @Input() orderCon      : Order;
    @Input() ordersConfirm : boolean;
    @Input() currency      : string;

    /**
     * OrderPaymentDetailComponent constructor
     */
    constructor(){

    }
}