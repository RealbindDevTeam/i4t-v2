import { UserDetailPenalty } from './user-detail.model';

/**
 * User Penalty Model
 */
export interface UserPenalty{
    _id?: string;
    user_id: string;
    is_active: boolean;
    last_date: Date;
    penalties: UserDetailPenalty[];
}