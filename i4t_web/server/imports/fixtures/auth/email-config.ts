import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Parameter } from '../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../both/collections/general/parameter.collection';
import { EmailContents } from '../../../../both/collections/general/email-content.collection';
import { EmailContent } from '../../../../both/models/general/email-content.model';

Accounts.urls.resetPassword = function (token) {
    return Meteor.absoluteUrl('reset-password/' + token);
};

function greet() {
    return function (user, url) {

        let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
        let greetVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'greetVar');
        let welcomeMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'welcomeMsgVar');
        let btnTextVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'btnTextVar');
        let beforeMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'beforeMsgVar');
        let regardVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'regardVar');
        let followMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'followMsgVar');

        let facebookVar = Parameters.collection.findOne({ name: 'facebook_link' }).value;
        let twitterVar = Parameters.collection.findOne({ name: 'twitter_link' }).value;
        let instagramVar = Parameters.collection.findOne({ name: 'instagram_link' }).value;
        let iurestVar = Parameters.collection.findOne({ name: 'iurest_url' }).value;
        let iurestImgVar = Parameters.collection.findOne({ name: 'iurest_img_url' }).value;

        var greeting = (user.profile && user.profile.first_name) ? (greetVar + ' ' + user.profile.first_name + ",") : greetVar;

        return `
        <table border="0" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5">
        <tbody>
            <tr>
                <td style="padding: 20px 0 30px 0;">
                    <table style="border-collapse: collapse; box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12), 0 3px 1px -2px rgba(0, 0, 0, 0.2);"
                        border="0" width="60%" cellspacing="0" cellpadding="0" align="center">
                        <tbody>
                            <tr>
                                <td style="padding: 10px 0 10px 0;" align="center" bgcolor="#3c4146"><img style="display: block;" src=${iurestImgVar}logo_iurest_white.png alt="Reset passwd" /></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 30px 10px 30px;" bgcolor="#ffffff">
                                    <table border="0" width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                            <tr>
                                                <td style="padding: 15px 0 0 0; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold;">${greeting}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 15px 0 10px 0; font-family: Arial, sans-serif;">${welcomeMsgVar}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 20px 0 20px 0; font-family: Arial, sans-serif;">
                                                    <div align="center"><a style="background-color: white; border-style: solid; border-width: 2px; color: #EF5350; text-align: center; padding: 10px 30px; text-decoration: none; font-weight: bold "
                                                            href="${url}">${btnTextVar}</a></div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 0 0 0 0; font-family: Arial, sans-serif;">
                                                    <p>${beforeMsgVar} <br /> ${regardVar}</p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 0px 30px 10px 30px;" bgcolor="#ffffff">
                                    <hr />
                                    <table border="0" width="100%" cellspacing="0" cellpadding="0">
                                        <tbody>
                                            <tr>
                                                <td style="font-family: Arial, sans-serif;">${followMsgVar}</td>
                                                <td align="right">
                                                    <table border="0" cellspacing="0" cellpadding="0">
                                                        <tbody>
                                                            <tr>
                                                                <td><a href=${facebookVar}> <img style="display: block;" src=${iurestImgVar}facebook_red.png alt="Facebook" /> </a></td>
                                                                <td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>
                                                                <td><a href=${twitterVar}> <img style="display: block;" src=${iurestImgVar}twitter_red.png alt="Twitter" /> </a></td>
                                                                <td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>
                                                                <td><a href=${instagramVar}> <img style="display: block;" src=${iurestImgVar}instagram_red.png alt="Instagram" /> </a></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-family: Arial, sans-serif; padding: 10px 0 10px 0;"><a style="font-family: Arial, sans-serif; text-decoration: none; float: left;"
                                                        href=${iurestVar}>iurest.com</a></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
               `;
    };
}

function greetText() {
    return function (user, url) {

        let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
        let greetVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'greetVar');
        let welcomeMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'welcomeMsgVar');
        let btnTextVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'btnTextVar');
        let beforeMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'beforeMsgVar');
        let regardVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'regardVar');
        let followMsgVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'followMsgVar');

        var greeting = (user.profile && user.profile.first_name) ? (greetVar + user.profile.first_name + ",") : greetVar;

        return `    ${greeting}
                    ${welcomeMsgVar}
                    ${url}
                    ${beforeMsgVar}
                    ${regardVar}
               `;
    }
}

Accounts.emailTemplates = {
    from: '',
    siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
    resetPassword: {
        subject: function (user) {
            let emailContent: EmailContent = EmailContents.collection.findOne({ language: user.profile.language_code });
            let subjectVar = Meteor.call('getEmailContent', emailContent.lang_dictionary, 'resetPasswordSubjectVar');

            return subjectVar + ' ' + Accounts.emailTemplates.siteName;
        },
        html: greet(),
        text: greetText(),
    },
    verifyEmail: {
        subject: function (user) {
            return "How to verify email address on " + Accounts.emailTemplates.siteName;
        },
        text: greet()
    },
    enrollAccount: {
        subject: function (user) {
            return "An account has been created for you on " + Accounts.emailTemplates.siteName;
        },
        text: greet()
    }
};


Accounts.emailTemplates.resetPassword.from = () => {
    let fromVar = Parameters.collection.findOne({ name: 'from_email' }).value;
    return fromVar;
};
