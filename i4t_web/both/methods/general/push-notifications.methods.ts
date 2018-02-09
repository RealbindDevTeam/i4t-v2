import { Meteor } from 'meteor/meteor';
import { OneSignal } from 'meteor/astrocoders:one-signal';

if (Meteor.isServer) {
    Meteor.methods ({
        sendPush: function ( _userDeviceId : string[], content : string ){
            const data = {
                contents: {
                    en: content,  
                }
            };
            OneSignal.Notifications.create( _userDeviceId, data );
        }
    });
}