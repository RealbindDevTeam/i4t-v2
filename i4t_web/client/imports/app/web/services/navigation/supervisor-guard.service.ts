import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';

@Injectable()
export class SupervisorGuard implements CanActivate {

    private auxIs: boolean;
    private auxRole: any;

    constructor(private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        return MeteorObservable.call('getRole').map((role) => {
            if (role == "600" || role == "100") {
                return true;
            }
            this.router.navigate(['/404']);
            Meteor.logout();
            return false;
        }, (error) => {
            alert(error);
        });
    }
}