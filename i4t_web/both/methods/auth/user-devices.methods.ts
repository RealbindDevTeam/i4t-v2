import { Meteor } from 'meteor/meteor';
//import { UserDetails } from '../../collections/auth/user-detail.collection';
//import { UserDetail } from '../../models/auth/user-detail.model';

import { UserDevices } from '../../collections/auth/device.collection';
import { UserDevice, Device } from '../../models/auth/device.model';

if (Meteor.isServer) {
    Meteor.methods({
        userDevicesValidation: function ( _data : any ) {
            var _device = new Device();
            var _userDevice = UserDevices.collection.find({user_id: this.userId});

            _device.player_id = _data.userId;
            _device.is_active = true;
            
            if( _userDevice.count() === 0 ) {

                UserDevices.insert({
                    user_id : Meteor.userId(),
                    devices: [ _device ],
                });
            } else if (_userDevice.count() > 0 ) {
                _userDevice.fetch().forEach( (usr_dev) => {
                    let _dev_val = UserDevices.collection.find({ "devices.player_id" : _data.userId });
                    if (!_dev_val){
                        UserDevices.update({ _id : usr_dev._id },
                            { $addToSet : {
                                devices:  _device
                            }
                        });
                    } else {

                        UserDevices.update({ "devices.player_id" : _data.userId },
                            { $set : { "devices.$.is_active" : true }
                        });
                    }
                });
            }
        }
    });
}


    
