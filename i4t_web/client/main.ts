import './polyfills';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { AppModule } from './imports/app/app.module';
import { Meteor } from 'meteor/meteor';

import '../both/methods/menu/item.methods';
import '../both/methods/auth/collaborators.methods';
import '../both/methods/auth/menu.methods';
import '../both/methods/auth/user-detail.methods';
import '../both/methods/auth/user-devices.methods';
import '../both/methods/auth/user-login.methods';
import '../both/methods/auth/user.methods';
import '../both/methods/general/cron.methods';
import '../both/methods/general/email.methods';
import '../both/methods/general/parameter.methods';
import '../both/methods/general/change-email.methods';
import '../both/methods/general/country.methods';
import '../both/methods/general/iurest-invoice.methods';
import '../both/methods/general/push-notifications.methods';
import '../both/methods/establishment/establishment.methods';
import '../both/methods/establishment/order-history.methods';
import '../both/methods/establishment/order.methods';
import '../both/methods/establishment/schedule.methods';
import '../both/methods/establishment/table.method';
import '../both/methods/establishment/waiter-queue/waiter-queue.methods';
import '../both/methods/establishment/waiter-queue/queues.methods';

function setClass(css:any) {
    if (!document.body.className) {
        document.body.className = "";
    }
    document.body.className += " " + css;
}

Meteor.startup(() => {
    setClass('web');
    enableProdMode();
    platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.log(err));
});