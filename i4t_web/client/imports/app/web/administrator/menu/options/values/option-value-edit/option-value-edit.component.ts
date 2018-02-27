import { Component, OnInit, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar } from '@angular/material';
import { UserLanguageService } from '../../../../../services/general/user-language.service';

@Component({
    selector: 'option-value-edit',
    templateUrl: './option-value-edit.component.html',
    styleUrls: ['./option-value-edit.component.scss'],
    providers: [UserLanguageService]
})
export class OptionValueEditComponent implements OnInit {

    ngOnInit() {

    }
}