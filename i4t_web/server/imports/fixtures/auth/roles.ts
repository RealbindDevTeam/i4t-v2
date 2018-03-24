import { Roles } from '../../../../both/collections/auth/role.collection';
import { Role } from '../../../../both/models/auth/role.model';

export function loadRoles() {

    if(Roles.find().cursor.count() === 0 ){

        const roles: Role[] = [{
            _id: "100",
            is_active: true,
            name: "ROLE.ADMINISTRATOR",
            description: "establishment administrator",
            menus: ["900", "1000", "1400","2000", "3000", "10000", "20000"]
        },{
            _id: "200",
            is_active: true,
            name: "ROLE.WAITER",
            description: "establishment waiter",
            menus: ["8000","9000", "20000"],
            user_prefix: 'wa'
        },{
            _id: "300",
            is_active: true,
            name: "ROLE.CASHIER",
            description: "establishment cashier",
            menus: ["13000", "20000"],
            user_prefix: 'ca'            
        },{
            _id: "400",
            is_active: true,
            name: "ROLE.CUSTOMER",
            description: "establishment customer",
            menus: ["4000","6000","11000","12000","20000", "19000"]
        },{
            _id: "600",
            is_active: true,
            name: "ROLE.SUPERVISOR",
            description: "establishment supervisor",
            menus: ["910","1100","3100", "1200", "1300", "20000"],
            user_prefix: 'sp'            
        }];

        roles.forEach((role: Role) => Roles.insert(role));
    }
}