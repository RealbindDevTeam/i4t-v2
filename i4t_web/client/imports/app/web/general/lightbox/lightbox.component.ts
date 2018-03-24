import { Component, HostListener, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'lightbox',
    templateUrl: './lightbox.component.html',
    styleUrls: ['./lightbox.component.scss']
})
export class LightBoxComponent {
    private _currentImage: string;
    private _index: number;
    /**
     * LightBoxComponent constructor
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this._index = data.index;
        this.changeImage(this._index);
    }

    /**
     * Change indez img position
     */
    @HostListener("window:keydown", ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            if (this._index <= 0) {
                this._index = this.data.images.length - 1;
            } else {
                this._index = this._index - 1;
            }
            this.changeImage(this._index);
        }

        if (event.key === 'ArrowRight') {
            if (this._index >= (this.data.images.length - 1)) {
                this._index = 0;
            } else {
                this._index = this._index + 1;
            }
            this.changeImage(this._index);
        }
    }

    /**
     * Set image position
     * @param _pIndex 
     */
    changeImage(_pIndex: number) {
        this._currentImage = this.data.images[_pIndex].url;
    }

    /**
     * Close the dialog
     */
    closeDialog() {
        this._dialogRef.close({ success: false });
    }
}