import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Meteor } from 'meteor/meteor';

@Injectable()
export class RouteGuard implements CanActivateChild {

    constructor() {
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return !!Meteor.userId();
    }
}