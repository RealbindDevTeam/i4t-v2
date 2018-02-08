import { PointValidity } from '../../../../both/models/general/point-validity.model';
import { PointsValidity } from '../../../../both/collections/general/point-validity.collection';

export function loadPointsValidity() {
    if (PointsValidity.find().cursor.count() === 0) {
        const poinst_validity: PointValidity[] = [
            { _id: "15", point_validity: "15" },
            { _id: "16", point_validity: "16" },
            { _id: "17", point_validity: "17" },
            { _id: "18", point_validity: "18" },
            { _id: "19", point_validity: "19" },
            { _id: "20", point_validity: "20" },
            { _id: "21", point_validity: "21" },
            { _id: "22", point_validity: "22" },
            { _id: "23", point_validity: "23" },
            { _id: "24", point_validity: "24" },
            { _id: "25", point_validity: "25" },
            { _id: "26", point_validity: "26" },
            { _id: "27", point_validity: "27" },
            { _id: "28", point_validity: "28" },
            { _id: "29", point_validity: "29" },
            { _id: "30", point_validity: "30" },
        ];
        poinst_validity.forEach((pnt_validity: PointValidity) => PointsValidity.insert(pnt_validity));
    }
}