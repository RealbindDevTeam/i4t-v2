import { Hour } from '../../../../both/models/general/hour.model';
import { Hours } from '../../../../both/collections/general/hours.collection';

export function loadHours() {

    if(Hours.find().cursor.count() === 0 ){
        const hours: Hour[] = [
            { hour:'00:00' },
            { hour:'00:30' },
            { hour:'01:00' },
            { hour:'01:30' },
            { hour:'02:00' },
            { hour:'02:30' },
            { hour:'03:00' },
            { hour:'03:30' },
            { hour:'04:00' },
            { hour:'04:30' },
            { hour:'05:00' },
            { hour:'05:30' },
            { hour:'06:00' },
            { hour:'06:30' },
            { hour:'07:00' },
            { hour:'07:30' },
            { hour:'08:00' },
            { hour:'08:30' },
            { hour:'09:00' },
            { hour:'09:30' },
            { hour:'10:00' },
            { hour:'10:30' },
            { hour:'11:00' },
            { hour:'11:30' },
            { hour:'12:00' },
            { hour:'12:30' },
            { hour:'13:00' },
            { hour:'13:30' },
            { hour:'14:00' },
            { hour:'14:30' },
            { hour:'15:00' },
            { hour:'15:30' },
            { hour:'16:00' },
            { hour:'16:30' },
            { hour:'17:00' },
            { hour:'17:30' },
            { hour:'18:00' },
            { hour:'18:30' },
            { hour:'19:00' },
            { hour:'19:30' },
            { hour:'20:00' },
            { hour:'20:30' },
            { hour:'21:00' },
            { hour:'21:30' },
            { hour:'22:00' },
            { hour:'22:30' },
            { hour:'23:00' },
            { hour:'23:30' }
        ];

        hours.forEach((hour:Hour) => Hours.insert(hour));
    }
}