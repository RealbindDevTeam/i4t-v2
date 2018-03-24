/**
 * User Login Model
 */
export class UserLogin {
    user_id: string;
    login_date: Date;
    app_code_name: string;
    app_name: string;
    app_version: string;
    cookie_enabled: boolean;
    language: string;
    platform: string;
    cordova_version?: string;
    model?: string;
    platform_device?: string;
    version?: string;
}