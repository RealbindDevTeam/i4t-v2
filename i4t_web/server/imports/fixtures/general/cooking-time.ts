import { CookingTime } from '../../../../both/models/general/cooking-time.model';
import { CookingTimes } from '../../../../both/collections/general/cooking-time.collection';

export function loadCookingTimes() {
    if(CookingTimes.find().cursor.count() === 0 ){
        const cooking_times: CookingTime[] = [
            { _id: "10", cooking_time: "5 min aprox" }, 
            { _id: "20", cooking_time: "15 min aprox" },
            { _id: "30", cooking_time: "30 min aprox" }, 
            { _id: "40", cooking_time: "45 min aprox" },
            { _id: "50", cooking_time: "1 h aprox" }, 
            { _id: "60", cooking_time: "1 h 15 min aprox" },
            { _id: "70", cooking_time: "1 h 30 min aprox" }, 
            { _id: "80", cooking_time: "1 h 45 min aprox" },
            { _id: "90", cooking_time: "2 h aprox" }, 
            { _id: "100", cooking_time: "+ 2 h aprox" }
        ];
        cooking_times.forEach((cooking:CookingTime) => CookingTimes.insert(cooking));
    }
}