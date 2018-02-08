import { Point } from '../../../../both/models/general/point.model';
import { Points } from '../../../../both/collections/general/point.collection';

export function loadPoints() {
    if(Points.find().cursor.count() === 0 ){
        const points: Point[] = [
            { _id: "5", point: "5 pts" }, 
            { _id: "10", point: "10 pts" }, 
            { _id: "15", point: "15 pts" },
            { _id: "20", point: "20 pts" }, 
            { _id: "25", point: "25 pts" }, 
            { _id: "30", point: "30 pts" }, 
            { _id: "35", point: "35 pts" },
            { _id: "40", point: "40 pts" }, 
            { _id: "45", point: "45 pts" }, 
            { _id: "50", point: "50 pts" }, 
            { _id: "55", point: "55 pts" },
            { _id: "60", point: "60 pts" }, 
            { _id: "65", point: "65 pts" }, 
            { _id: "70", point: "70 pts" }, 
            { _id: "75", point: "75 pts" },
            { _id: "80", point: "80 pts" }, 
            { _id: "85", point: "85 pts" }, 
            { _id: "90", point: "90 pts" }, 
            { _id: "95", point: "95 pts" },
            { _id: "100", point: "100 pts" }
        ];
        points.forEach((point:Point) => Points.insert(point));
    }
}