import { Component, ElementRef, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
import { NavigationService } from './navigation/navigation.service';
import { Router, Event, NavigationStart, NavigationEnd } from '@angular/router';
import 'hammerjs';
import { OrderNavigationService } from './services/navigation/order-navigation.service';
import { UserLanguageService } from './services/general/user-language.service';
import { ImageService } from './services/general/image.service';
import { PayuPaymentService } from './services/payment/payu-payment.service';

@Component({
    selector: 'app',
    providers: [OrderNavigationService, UserLanguageService, ImageService, PayuPaymentService],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
    private pageTitle: string;

    constructor(private _navigation: NavigationService,
        private _router: Router,
        private _elementRef: ElementRef,
        private _orderNavigationService: OrderNavigationService,
        private _userLanguageService: UserLanguageService,
        private _payuPaymentService: PayuPaymentService) {
        var stopStyle = ['font-family: Roboto, "Helvetica Neue", sans-serif',
            'font-size: 1.7rem',
            'color: Red',
            'font-weight: 600'].join(';');
        console.log('%c Stop!!', stopStyle);
        var msgStyle = ['font-family: Roboto, "Helvetica Neue", sans-serif',
            'font-size: 1.4rem',
            'color: #114b5f',
            'font-weight: 500'].join(';');
        console.log('%c This browser function is intended for developers. If someone tells you to copy and paste something here to enable a function of comeygana or to "hack" someone\'s account, it is a fraud. If you do, this person can access your account.', msgStyle);
    }

    ngOnInit() {
        this._router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                this._navigation.setIsRouteLoading(true);
                this._navigation.setBreadcrumbs(null); // Reset breadcrumbs before route change
                this._navigation.setPageTitle(null); // Reset page title before route change
            } else if (event instanceof NavigationEnd) {
                this._navigation.setCurrentRoute((<NavigationEnd>event).urlAfterRedirects);
                this._navigation.setIsRouteLoading(false);
                let routerOutletComponent: HTMLElement = this._elementRef.nativeElement.getElementsByTagName('app-topnav')[0];
                if (routerOutletComponent) {
                    routerOutletComponent.scrollIntoView(); // Scroll back to top after route change
                }
            }
        });
        this._navigation.pageTitle.subscribe(pageTitle => {
            this.pageTitle = pageTitle;
        });
    }

    @HostListener('window:resize', ['$event'])
    private resize($event) {
        // Need this to trigger change detection for screen size changes!
        this._navigation.updateViewport();
    }
}