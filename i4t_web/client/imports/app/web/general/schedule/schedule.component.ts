import { Component, OnInit, OnDestroy, NgZone, EventEmitter, Input, Output } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Hours } from '../../../../../../both/collections/general/hours.collection';
import { Hour } from '../../../../../../both/models/general/hour.model';
import { EstablishmentSchedule } from '../../../../../../both/models/establishment/establishment.model';

@Component({
    selector: 'iu-schedule',
    templateUrl: './schedule.component.html',
    styleUrls: ['./schedule.component.scss']
})
export class IurestScheduleComponent implements OnInit, OnDestroy {

    @Input() scheduleToEdit: EstablishmentSchedule;

    @Output() finalSchedule = new EventEmitter();

    private _hoursSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _hours: Observable<Hour[]>;

    private _selectedOpenTime: string;
    private _selectedCloseTime: string;
    private _allowWeekButtons: boolean;

    private _activeMonday: boolean;
    private _activeTuesday: boolean;
    private _activeWednesday: boolean;
    private _activeThursday: boolean;
    private _activeFriday: boolean;
    private _activeSaturday: boolean;
    private _activeSunday: boolean;
    private _activeHoliday: boolean;

    private schedule: EstablishmentSchedule;

    /**
     * IurestScheduleComponent constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
        this._selectedOpenTime = "";
        this._selectedCloseTime = "";
        this._allowWeekButtons = false;
        this._activeMonday = false;
        this._activeTuesday = false;
        this._activeWednesday = false;
        this._activeThursday = false;
        this._activeFriday = false;
        this._activeSaturday = false;
        this._activeSunday = false;
        this._activeHoliday = false;
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        if (this.scheduleToEdit) {
            this.schedule = this.scheduleToEdit;
            this._activeMonday = this.schedule.monday.isActive;
            this._activeTuesday = this.schedule.tuesday.isActive;
            this._activeWednesday = this.schedule.wednesday.isActive;
            this._activeThursday = this.schedule.thursday.isActive;
            this._activeFriday = this.schedule.friday.isActive;
            this._activeSaturday = this.schedule.saturday.isActive;
            this._activeSunday = this.schedule.sunday.isActive;
            this._activeHoliday = this.schedule.holiday.isActive;
        } else {
            this.schedule = {
                monday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                tuesday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                wednesday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                thursday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                friday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                saturday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                sunday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                },
                holiday: {
                    isActive: false,
                    opening_time: '',
                    closing_time: ''
                }
            };
        }

        this._hoursSub = MeteorObservable.subscribe('hours').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._hours = Hours.find({}, { sort: { hour: 1 } });
            });
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
     * Set open time
     * @param {string} _openTime 
     */
    changeOpenTime(_openTime): void {
        this._selectedOpenTime = _openTime;
        this.allowWeekButtons();
    }

    /**
     * Set close time
     * @param {string} _closeTime 
     */
    changeCloseTime(_closeTime): void {
        this._selectedCloseTime = _closeTime;
        this.allowWeekButtons();
    }

    /**
     * This function validate open time and close time and allow weekday buttons
     */
    allowWeekButtons(): void {
        if (this._selectedOpenTime !== "" && this._selectedCloseTime !== "") {
            this._allowWeekButtons = true;
        } else {
            this._allowWeekButtons = false;
        }
    }

    /**
     * Function to allow create weekday in schedule
     * @param {any} _pWeekDay 
     */
    evalueDays(_pWeekDay: any): void {
        if (_pWeekDay.value == "Mon") {
            this._activeMonday = !this._activeMonday;
        } else if (_pWeekDay.value == "Tues") {
            this._activeTuesday = !this._activeTuesday;
        } else if (_pWeekDay.value == "Wed") {
            this._activeWednesday = !this._activeWednesday;
        } else if (_pWeekDay.value == "Thur") {
            this._activeThursday = !this._activeThursday;
        } else if (_pWeekDay.value == "Fri") {
            this._activeFriday = !this._activeFriday;
        } else if (_pWeekDay.value == "Sat") {
            this._activeSaturday = !this._activeSaturday;
        } else if (_pWeekDay.value == "Sun") {
            this._activeSunday = !this._activeSunday;
        } else if (_pWeekDay.value == "Hol") {
            this._activeHoliday = !this._activeHoliday;
        }
    }

    /**
     * Function to build schedule. When schedule is modified this function send current schedule to parent component
     */
    buildSchedule(): void {
        if (this._activeMonday) {
            this.schedule.monday.isActive = true;
            this.schedule.monday.opening_time = this._selectedOpenTime;
            this.schedule.monday.closing_time = this._selectedCloseTime;
        }

        if (this._activeTuesday) {
            this.schedule.tuesday.isActive = true;
            this.schedule.tuesday.opening_time = this._selectedOpenTime;
            this.schedule.tuesday.closing_time = this._selectedCloseTime;
        }

        if (this._activeWednesday) {
            this.schedule.wednesday.isActive = true;
            this.schedule.wednesday.opening_time = this._selectedOpenTime;
            this.schedule.wednesday.closing_time = this._selectedCloseTime;
        }

        if (this._activeThursday) {
            this.schedule.thursday.isActive = true;
            this.schedule.thursday.opening_time = this._selectedOpenTime;
            this.schedule.thursday.closing_time = this._selectedCloseTime;
        }

        if (this._activeFriday) {
            this.schedule.friday.isActive = true;
            this.schedule.friday.opening_time = this._selectedOpenTime;
            this.schedule.friday.closing_time = this._selectedCloseTime;
        }

        if (this._activeSaturday) {
            this.schedule.saturday.isActive = true;
            this.schedule.saturday.opening_time = this._selectedOpenTime;
            this.schedule.saturday.closing_time = this._selectedCloseTime;
        }

        if (this._activeSunday) {
            this.schedule.sunday.isActive = true;
            this.schedule.sunday.opening_time = this._selectedOpenTime;
            this.schedule.sunday.closing_time = this._selectedCloseTime;
        }

        if (this._activeHoliday) {
            this.schedule.holiday.isActive = true;
            this.schedule.holiday.opening_time = this._selectedOpenTime;
            this.schedule.holiday.closing_time = this._selectedCloseTime;
        }

        this.finalSchedule.emit(this.schedule);
    }

    /**
     * This function inactive day in current schedule. When schedule is modified this function send current schedule to parent component
     * @param {string} _pWeekDay 
     */
    inactiveDay(_pWeekDay: string): void {
        if (_pWeekDay === "Mon") {
            this.schedule.monday.isActive = false;
            this.schedule.monday.opening_time = '';
            this.schedule.monday.closing_time = '';
            this._activeMonday = false;
        } else if (_pWeekDay === "Tues") {
            this.schedule.tuesday.isActive = false;
            this.schedule.tuesday.opening_time = '';
            this.schedule.tuesday.closing_time = '';
            this._activeTuesday = false;
        } else if (_pWeekDay === "Wed") {
            this.schedule.wednesday.isActive = false;
            this.schedule.wednesday.opening_time = '';
            this.schedule.wednesday.closing_time = '';
            this._activeWednesday = false;
        } else if (_pWeekDay === "Thur") {
            this.schedule.thursday.isActive = false;
            this.schedule.thursday.opening_time = '';
            this.schedule.thursday.closing_time = '';
            this._activeThursday = false;
        } else if (_pWeekDay === "Fri") {
            this.schedule.friday.isActive = false;
            this.schedule.friday.opening_time = '';
            this.schedule.friday.closing_time = '';
            this._activeFriday = false;
        } else if (_pWeekDay === "Sat") {
            this.schedule.saturday.isActive = false;
            this.schedule.saturday.opening_time = '';
            this.schedule.saturday.closing_time = '';
            this._activeSaturday = false;
        } else if (_pWeekDay === "Sun") {
            this.schedule.sunday.isActive = false;
            this.schedule.sunday.opening_time = '';
            this.schedule.sunday.closing_time = '';
            this._activeSunday = false;
        } else if (_pWeekDay === "Hol") {
            this.schedule.holiday.isActive = false;
            this.schedule.holiday.opening_time = '';
            this.schedule.holiday.closing_time = '';
            this._activeHoliday = false;
        }

        this.finalSchedule.emit(this.schedule);
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}