import { CollectionObject } from '../collection-object.model';

export interface UserDevice extends CollectionObject {
    user_id: string;
    devices : Device[];
}

export class Device {
    player_id: string;
    is_active : boolean;
}

