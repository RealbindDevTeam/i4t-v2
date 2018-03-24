import { Component, Input } from '@angular/core';
import { Order } from 'i4t_web/both/models/establishment/order.model';
import { User } from 'i4t_web/both/models/auth/user.model';
import { Users } from 'i4t_web/both/collections/auth/user.collection';
import { UserDetail, UserDetailImage } from 'i4t_web/both/models/auth/user-detail.model';
import { UserDetails } from 'i4t_web/both/collections/auth/user-detail.collection';

@Component({
	selector: 'order-detail',
	templateUrl: 'order-detail.html'
})

export class OrderDetailComponent {
	@Input()
	order: Order;

	@Input()
	isUser: boolean;

	@Input()
	currencyCode: string;

	/**
     * Return user image
     * @param {string} _pUserId 
     */
	getUserImage(_pUserId: string): string {
		let _lUser: User = Users.findOne({ _id: _pUserId });
		if (_lUser) {
			if (_lUser.services) {
				if (_lUser.services.facebook) {
					return "http://graph.facebook.com/" + _lUser.services.facebook.id + "/picture/?type=large";
				} else {
					let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });
					if (_lUserDetail) {
						let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
						if (_lUserDetailImage) {
							return _lUserDetailImage.url;
						} else {
							return 'assets/img/user_default_image.png';
						}
					}
					else {
						return 'assets/img/user_default_image.png';
					}
				}
			} else {
				return 'assets/img/user_default_image.png';
			}
		} else {
			return 'assets/img/user_default_image.png';
		}
	}

	/**
	 * Return user name
	 * @param {string} _pUserId 
	 */
	getUserName(_pUserId: string): string {
		let _lUser: User = Users.findOne({ _id: _pUserId });
		if (_lUser) {
			if (_lUser.username) {
				return _lUser.username;
			} else {
				if (_lUser.services) {
					if (_lUser.services.facebook) {
						return _lUser.services.facebook.name;
					} else {
						return '';
					}
				} else {
					return '';
				}
			}
		} else {
			return '';
		}
	}
}