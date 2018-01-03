import { Component, Input } from '@angular/core';
import { Order } from 'i4t_web/both/models/restaurant/order.model';

@Component({
	selector: 'order-detail',
	templateUrl: 'order-detail.html'
})

export class OrderDetailComponent {
    @Input()
	order: Order;

	@Input()
	isUser : boolean;

	@Input()
	currencyCode: string;
}