import { MongoObservable } from 'meteor-rxjs';
import { Menu } from '../../models/auth/menu.model';

export const Menus = new MongoObservable.Collection<Menu>('menus');
