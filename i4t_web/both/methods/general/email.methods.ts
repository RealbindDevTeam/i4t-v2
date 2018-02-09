import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Email } from 'meteor/email';
import { EmailContents } from '../../collections/general/email-content.collection';
import { EmailContent } from '../../models/general/email-content.model';
import { Establishments } from '../../collections/establishment/establishment.collection';
import { Establishment } from '../../models/establishment/establishment.model';
import { Users } from '../../collections/auth/user.collection';
import { User } from '../../models/auth/user.model';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';
import { SSR } from 'meteor/meteorhacks:ssr';

if (Meteor.isServer) {
    Meteor.methods({
        /**
         * This function validate if establishment trial period has ended
         */
        validateTrialPeriod: function (_countryId: string) {

            var currentDate: Date = new Date();
            var currentString: string = Meteor.call('convertDate', currentDate);
            var trialDays: number = Number.parseInt(Parameters.collection.findOne({ name: 'trial_days' }).value);
            var firstAdviceDays: number = Number.parseInt(Parameters.collection.findOne({ name: 'first_advice_days' }).value);
            var secondAdviceDays: number = Number.parseInt(Parameters.collection.findOne({ name: 'second_advice_days' }).value);
            var thirdAdviceDays: number = Number.parseInt(Parameters.collection.findOne({ name: 'third_advice_days' }).value);

            Establishments.collection.find({ countryId: _countryId, isActive: true, tstPeriod: true }).forEach(function <Establishment>(establishment, index, ar) {
                let diff = Math.round((currentDate.valueOf() - establishment.creation_date.valueOf()) / (1000 * 60 * 60 * 24));
                let forwardDate: Date = Meteor.call('addDays', establishment.creation_date, trialDays);
                let forwardString: string = Meteor.call('convertDate', forwardDate);
                let firstAdviceDate: Date = Meteor.call('substractDays', forwardDate, firstAdviceDays);
                let firstAdviceString: string = Meteor.call('convertDate', firstAdviceDate);
                let secondAdviceDate: Date = Meteor.call('substractDays', forwardDate, secondAdviceDays);
                let secondAdviceString: string = Meteor.call('convertDate', secondAdviceDate);
                let thirdAdviceDate: Date = Meteor.call('substractDays', forwardDate, thirdAdviceDays);
                let thirdAdviceString: string = Meteor.call('convertDate', thirdAdviceDate);

                if (diff > trialDays) {
                    Establishments.collection.update({ _id: establishment._id }, { $set: { isActive: false, tstPeriod: false } })
                } else {
                    if (currentString == firstAdviceString || currentString == secondAdviceString || currentString == thirdAdviceString) {
                        Meteor.call('sendTrialEmail', establishment.creation_user, forwardString);
                    }
                }
            });

            return "emailSend";
        },
        /**
         * This function convert the day and returning in format yyyy-m-d
         */
        convertDate: function (_date: Date) {
            let year = _date.getFullYear();
            let month = _date.getMonth() + 1;
            let day = _date.getDate();

            return year.toString() + '-' + month.toString() + '-' + day.toString();
        },
        /**
         * This function add days to the passed date
         */
        addDays: function (_date: Date, _days: number) {
            var result = new Date(_date);
            result.setDate(result.getDate() + _days);
            return result;
        },
        /**
         * This function substract days to the passed date
         */
        substractDays: function (_date: Date, _days: number) {
            var result = new Date(_date);
            result.setDate(result.getDate() - _days);
            return result;
        },
        /**
         * This function send de email to the account admin registered if trial period is going to end
         */
        sendTrialEmail: function (_userId: string, _forwardDate: string) {
            let user: User = Users.collection.findOne({ _id: _userId });
            let parameter: Parameter = Parameters.collection.findOne({ name: 'from_email' });
            let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
            var trial_email_subject: string = emailContent.lang_dictionary[0].traduction;
            var greeting: string = (user.profile && user.profile.first_name) ? (emailContent.lang_dictionary[1].traduction + ' ' + user.profile.first_name + ",") : emailContent.lang_dictionary[1].traduction;

            SSR.compileTemplate('htmlEmail', Assets.getText('html-email.html'));

            var emailData = {
                greeting: greeting,
                reminderMsgVar: emailContent.lang_dictionary[7].traduction,
                dateVar: _forwardDate,
                instructionMsgVar: emailContent.lang_dictionary[8].traduction,
                regardVar: emailContent.lang_dictionary[5].traduction,
                followMsgVar: emailContent.lang_dictionary[6].traduction
            }

            Email.send({
                to: user.emails[0].address,
                from: parameter.value,
                subject: trial_email_subject,
                html: SSR.render('htmlEmail', emailData),
            });
        }
    });
}