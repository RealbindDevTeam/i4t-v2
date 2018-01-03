import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from "rxjs";
import { Restaurant } from "../../../../../../../both/models/restaurant/restaurant.model";
import { Restaurants } from "../../../../../../../both/collections/restaurant/restaurant.collection";
import { User } from '../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { Role } from '../../../../../../../both/models/auth/role.model';
import { Roles } from '../../../../../../../both/collections/auth/role.collection';
import { SupervisorCollaboratorsEditionComponent } from '../edition/supervisor-collaborators-edition.component';

@Component({
    selector: 'supervisor-collaborators',
    templateUrl: './supervisor-collaborators.component.html',
    styleUrls: ['./supervisor-collaborators.component.scss']
})
export class SupervisorCollaboratorsComponent implements OnInit, OnDestroy {

    public _dialogRef: MatDialogRef<any>;
    private _userDetailSubscription: Subscription;
    private _userRestaurantSubscription: Subscription;
    private _userDetailsSubscription: Subscription;
    private _usersSubscription: Subscription;
    private _roleSubscription: Subscription;

    private _userDetails: Observable<UserDetail[]>;
    private _roles: Observable<Role[]>;
    private _users: Observable<User[]>;
    private _restaurant: Restaurant;
    private _userDetail: UserDetail;

    constructor(public _dialog: MatDialog,
        private _ngZone: NgZone,
        private _router: Router) {
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).subscribe(() => {
            this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });
            if (this._userDetail) {
                this._ngZone.run(() => {
                    this._userRestaurantSubscription = MeteorObservable.subscribe('getRestaurantById', this._userDetail.restaurant_work).subscribe(() => {
                        this._restaurant = Restaurants.findOne({ _id: this._userDetail.restaurant_work });
                    });

                    this._userDetailsSubscription = MeteorObservable.subscribe('getUsersDetailsForRestaurant', this._userDetail.restaurant_work).subscribe(() => {
                        this._userDetails = UserDetails.find({ restaurant_work: this._userDetail.restaurant_work, role_id: { $in: ['200', '300', '500'] } }).zone();
                    });

                    this._usersSubscription = MeteorObservable.subscribe('getUsersByRestaurant', this._userDetail.restaurant_work).subscribe(() => {
                        this._users = Users.find({}).zone();
                    });
                });
            }
        });
        this._roleSubscription = MeteorObservable.subscribe('getRoleCollaborators').subscribe(() => {
            this._roles = Roles.find({}).zone();
        });
    }

    /**
     * Collaboratos edition
     * @param _userdetail 
     */
    editCollaborator(_userdetail: UserDetail, _user: User) {
        this._dialogRef = this._dialog.open(SupervisorCollaboratorsEditionComponent, {
            disableClose: true,
            width: '75%'
        });
        this._dialogRef.componentInstance.selectUserDetail = _userdetail;
        this._dialogRef.componentInstance.selectUser = _user;
        this._dialogRef.afterClosed().subscribe(result => {
            this._dialogRef = null;
        });
    }

    /**
     * Open Collaborator register component
     */
    openCollaboratorstRegister() {
        this._router.navigate(['app/supervisor-collaborators-register']);
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        if (this._userDetailSubscription) { this._userDetailSubscription.unsubscribe(); }
        if (this._userRestaurantSubscription) { this._userRestaurantSubscription.unsubscribe(); }
        if (this._userDetailsSubscription) { this._userDetailsSubscription.unsubscribe(); }
        if (this._roleSubscription) { this._roleSubscription.unsubscribe(); }
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}