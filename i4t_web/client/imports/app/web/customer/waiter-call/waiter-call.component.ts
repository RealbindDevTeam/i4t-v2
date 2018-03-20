import { Component, ViewContainerRef, OnInit, OnDestroy, AfterContentInit, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Subject, Observable } from 'rxjs';
import { UserLanguageService } from '../../services/general/user-language.service';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { WaiterCallDetails } from '../../../../../../both/collections/establishment/waiter-call-detail.collection';
import { AlertConfirmComponent } from '../../../web/general/alert-confirm/alert-confirm.component';

@Component({
  selector: 'waiter-call',
  templateUrl: './waiter-call.component.html',
  styleUrls: ['./waiter-call.component.scss']
})
export class WaiterCallComponent implements OnInit, OnDestroy {

  private _userDetailSubscription: Subscription;
  private _waiterCallDetailSubscription: Subscription;
  private _ngUnsubscribe: Subject<void> = new Subject<void>();
  public _dialogRef: MatDialogRef<any>;

  private _userDetail: any;
  private _userDetails: any;
  private _waiterCallDetail: any;

  private _countDetails: number;
  private _userEstablishment: boolean;
  private _validatedWaterCall: boolean;
  private _loading: boolean;
  private titleMsg: string;
  private btnAcceptLbl: string;

  /**
   * WaiterCallPage Constructor
   * @param { TranslateService } _translate 
   * @param { ViewContainerRef } _viewContainerRef 
   * @param {NgZone} _ngZone
   * @param {UserLanguageService} _userLanguageService
   * @param {MatDialog} _mdDialog
   */
  constructor(protected _translate: TranslateService,
    public _viewContainerRef: ViewContainerRef,
    private _ngZone: NgZone,
    private _userLanguageService: UserLanguageService,
    protected _mdDialog: MatDialog) {
    _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    _translate.setDefaultLang('en');
    this.titleMsg = 'SIGNUP.SYSTEM_MSG';
    this.btnAcceptLbl = 'SIGNUP.ACCEPT';
  }

  /**
   * ngOnInit Implementation
   */
  ngOnInit() {
    this.removeSubscriptions();
    this._userDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
    this._waiterCallDetailSubscription = MeteorObservable.subscribe('countWaiterCallDetailByUsrId', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();

    MeteorObservable.autorun().subscribe(() => {
      this._userDetails = UserDetails.find({ user_id: Meteor.userId() });
      this._userDetail = UserDetails.collection.findOne({ user_id: Meteor.userId() });
      if (this._userDetail) {
        if (this._userDetail.current_table == "" && this._userDetail.current_establishment == "") {
          this._userEstablishment = false;
        } else {
          this._userEstablishment = true;
        }
        if (this._userEstablishment) {
          this._countDetails = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).count();
          if (this._countDetails > 0) {
            this._validatedWaterCall = true;
          } else {
            this._validatedWaterCall = false;
          }
        }
      }
    });
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  /**
   * Function that allows add calls to waiters enabled
   */
  addWaiterCall() {
    if (this._userDetail.current_table == "" && this._userDetail.current_establishment == "") {
      return;
    } else {
      var establishment_id = this._userDetail.current_establishment;
      var table_id = this._userDetail.current_table;
      var usrId = Meteor.userId();

      var data: any = {
        establishments: establishment_id,
        tables: table_id,
        user: usrId,
        waiter_id: "",
        status: "waiting",
        type: "CALL_OF_CUSTOMER",
      }

      this._loading = true;
      setTimeout(() => {
        MeteorObservable.call('findQueueByEstablishment', data).subscribe(() => {
          this._loading = false;
        }, (error) => {
          this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
      }, 1500);
    }
  }

  /**
   * Function taht allow cancel calls to waiter
   */
  cancelWaiterCall() {
    this._loading = true;
    setTimeout(() => {
      let waiterCall = WaiterCallDetails.collection.find({ user_id: Meteor.userId(), type: 'CALL_OF_CUSTOMER', establishment_id: this._userDetail.current_establishment, status: { $in: ["waiting", "completed"] } }).fetch()[0];
      MeteorObservable.call('cancelCallClient', waiterCall, Meteor.userId()).subscribe(() => {
        this._loading = false;
      });
    });
  }

  /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
  openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

    this._dialogRef = this._mdDialog.open(AlertConfirmComponent, {
      disableClose: true,
      data: {
        title: title,
        subtitle: subtitle,
        content: content,
        buttonCancel: btnCancelLbl,
        buttonAccept: btnAcceptLbl,
        showBtnCancel: showBtnCancel
      }
    });
    this._dialogRef.afterClosed().subscribe(result => {
      this._dialogRef = result;
      if (result.success) {

      }
    });
  }

  /**
   * ngOnDestroy implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }
}