import { Injectable } from '@angular/core';
import { PickOptions } from '../../../../../../both/models/general/pick-options.model';
import * as filestack from 'filestack-js';

@Injectable()
export class ImageService {

    private _apikey = Meteor.settings.public.filepicker.key;
    //private _security = Meteor.settings.public.filepicker.security;
    //private _client: any = filestack.init(this._apikey, this._security);
    private _client: any = filestack.init(this._apikey);
    private _pickOptions: PickOptions = {
        fromSources: ["local_file_system", "imagesearch", "facebook", "instagram"],
        lang: "en",
        maxSize: 1048576,
        maxFiles: 1,
        minFiles: 1
    }
    private _pickOptionsMultipleFiles: PickOptions = {
        fromSources: ["local_file_system", "imagesearch", "facebook", "instagram"],
        lang: "en",
        maxSize: 1048576,
        maxFiles: 15,
        minFiles: 1
    }

    /**
     * Return filestack client
     */
    get client(): any {
        return this._client;
    }

    /**
     * Return pickOptions to filestack client
     */
    get pickOptions(): Object {
        return this._pickOptions;
    }

    /**
     * Return pickOptions with multiple files to filestack client
     */
    get pickOptionsMultipleFiles(): Object{
        return this._pickOptionsMultipleFiles;
    }

    /**
     * Set language in pickOptions
     * @param {string} _pLanguage 
     */
    setPickOptionsLang(_pLanguage: string): void {
        this._pickOptions.lang = _pLanguage;
    }
}