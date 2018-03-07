import { Meteor } from 'meteor/meteor';
import { Establishments, EstablishmentsProfile } from '../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { check } from 'meteor/check';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { PaymentsHistory } from '../../../../both/collections/payment/payment-history.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { PaymentHistory } from '../../../../both/models/payment/payment-history.model';

/**
 * Meteor publication establishments with creation user condition
 * @param {string} _userId
 */
Meteor.publish('establishments', function (_userId: string) {
    check(_userId, String);
    return Establishments.find({ creation_user: _userId });
});

/**
 * Meteor publications establishmentByCurrentUser
 * @param {string} _userId
 */

Meteor.publish('getEstablishmentByCurrentUser', function (_userId: string) {
    check(_userId, String);
    var user_detail = UserDetails.findOne({ user_id: _userId });
    if (user_detail) {
        return Establishments.find({ _id: user_detail.current_establishment });
    } else {
        return;
    }
});

/**
 * Meteor publications establishmentByEstablishmentWork
 * @param {string} _userId
 */

Meteor.publish('getEstablishmentByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    var user_detail = UserDetails.findOne({ user_id: _userId });
    if (user_detail) {
        return Establishments.find({ _id: user_detail.establishment_work });
    } else {
        return;
    }
});

/**
 * Meteor publication to find current establishments with no pay
 * @param {string} _userId
 */
Meteor.publish('currentEstablishmentsNoPayed', function (_userId: string) {
    check(_userId, String);

    let currentDate: Date = new Date();
    let currentMonth: string = (currentDate.getMonth() + 1).toString();
    let currentYear: string = currentDate.getFullYear().toString();
    let historyPaymentRes: string[] = [];
    let establishmentsInitial: string[] = [];

    Establishments.collection.find({ creation_user: _userId, isActive: true, freeDays: false }).fetch().forEach(function <Establishment>(establishment, index, arr) {
        establishmentsInitial.push(establishment._id);
    });

    PaymentsHistory.collection.find({
        establishmentIds: {
            $in: establishmentsInitial
        }, month: currentMonth, year: currentYear, $or: [{ status: 'TRANSACTION_STATUS.APPROVED' }, { status: 'TRANSACTION_STATUS.PENDING' }]
    }).fetch().forEach(function <PaymentHistory>(historyPayment, index, arr) {
        historyPayment.establishment_ids.forEach((establishment) => {
            historyPaymentRes.push(establishment);
        });
    });

    return Establishments.find({ _id: { $nin: historyPaymentRes }, creation_user: _userId, isActive: true, freeDays: false });
});

/**
 * Meteor publication to find inactive establishments by user
 */
Meteor.publish('getInactiveEstablishments', function (_userId: string) {
    check(_userId, String);
    return Establishments.find({ creation_user: _userId, isActive: false });
});

/**
 * Meteor publication return active establishments by user
 * @param {string} _userId
 */
Meteor.publish('getActiveEstablishments', function (_userId: string) {
    check(_userId, String);
    return Establishments.find({ creation_user: _userId, isActive: true });
});

/**
 * Meteor publication return establishments by id
 * @param {string} _pId
 */
Meteor.publish('getEstablishmentById', function (_pId: string) {
    check(_pId, String);
    return Establishments.find({ _id: _pId });
});

/**
 * Meteor publication return establishment profile by establishment id
 */
Meteor.publish('getEstablishmentProfile', function (_establishmentId: string) {
    check(_establishmentId, String);
    return EstablishmentsProfile.find({ establishment_id: _establishmentId });
});

/**
 * Meteor publication return establishments by ids
 * @param {string[]} _pId
 */
Meteor.publish('getEstablishmentsByIds', function (_pIds: string[]) {
    return Establishments.find({ _id: { $in: _pIds } });
});

/**
 * Meteor publication return establishments
 */
Meteor.publish('getEstablishments', function () {
    return Establishments.find({});
});