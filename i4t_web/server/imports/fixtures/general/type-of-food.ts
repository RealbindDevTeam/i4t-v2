import { TypeOfFood } from '../../../../both/models/general/type-of-food.model';
import { TypesOfFood } from '../../../../both/collections/general/type-of-food.collection';

export function loadTypesOfFood() {
    if (TypesOfFood.find().cursor.count() === 0) {
        const types: TypeOfFood[] = [
            { _id: "10", type_of_food: "TYPE_OF_FOOD.GERMAN_FOOD" },
            { _id: "20", type_of_food: "TYPE_OF_FOOD.AMERICAN_FOOD" },
            { _id: "30", type_of_food: "TYPE_OF_FOOD.ARABIC_FOOD" },
            { _id: "40", type_of_food: "TYPE_OF_FOOD.ARGENTINE_FOOD" },
            { _id: "50", type_of_food: "TYPE_OF_FOOD.ASIAN_FOOD" },
            { _id: "60", type_of_food: "TYPE_OF_FOOD.BRAZILIAN_FOOD" },
            { _id: "70", type_of_food: "TYPE_OF_FOOD.HOMEMADE_FOOD" },
            { _id: "80", type_of_food: "TYPE_OF_FOOD.CHILEAN_FOOD" },
            { _id: "90", type_of_food: "TYPE_OF_FOOD.CHINESE_FOOD" },
            { _id: "100", type_of_food: "TYPE_OF_FOOD.COLOMBIAN_FOOD" },
            { _id: "110", type_of_food: "TYPE_OF_FOOD.COREAN_FOOD" },
            { _id: "120", type_of_food: "TYPE_OF_FOOD.MIDDLE_EASTERN_FOOD" },
            { _id: "130", type_of_food: "TYPE_OF_FOOD.SPANISH_FOOD" },
            { _id: "140", type_of_food: "TYPE_OF_FOOD.FRENCH_FOOD" },
            { _id: "150", type_of_food: "TYPE_OF_FOOD.FUSION_FOOD" },
            { _id: "160", type_of_food: "TYPE_OF_FOOD.GOURMET_FOOD" },
            { _id: "170", type_of_food: "TYPE_OF_FOOD.GREEK_FOOD" },
            { _id: "180", type_of_food: "TYPE_OF_FOOD.INDIAN_FOOD" },
            { _id: "190", type_of_food: "TYPE_OF_FOOD.INTERNATIONAL_FOOD" },
            { _id: "200", type_of_food: "TYPE_OF_FOOD.ITALIAN_FOOD" },
            { _id: "210", type_of_food: "TYPE_OF_FOOD.JAPANESE_FOOD" },
            { _id: "220", type_of_food: "TYPE_OF_FOOD.LATIN_AMERICAN_FOOD" },
            { _id: "230", type_of_food: "TYPE_OF_FOOD.MEDITERRANEAN_FOOD" },
            { _id: "240", type_of_food: "TYPE_OF_FOOD.MEXICAN_FOOD" },
            { _id: "250", type_of_food: "TYPE_OF_FOOD.ORGANIC_FOOD" },
            { _id: "260", type_of_food: "TYPE_OF_FOOD.PERUVIAN_FOOD" },
            { _id: "270", type_of_food: "TYPE_OF_FOOD.FAST_FOOD" },
            { _id: "280", type_of_food: "TYPE_OF_FOOD.THAI_FOOD" },
            { _id: "290", type_of_food: "TYPE_OF_FOOD.VEGETARIAN_FOOD" },
            { _id: "300", type_of_food: "TYPE_OF_FOOD.VIETNAMESE_FOOD" },
            { _id: "310", type_of_food: "TYPE_OF_FOOD.OTHERS" },
            { _id: "320", type_of_food: "TYPE_OF_FOOD.BARBECUE" },
            { _id: "330", type_of_food: "TYPE_OF_FOOD.PASTA" },
            { _id: "340", type_of_food: "TYPE_OF_FOOD.FISH_AND_SEAFOOD" },
            { _id: "350", type_of_food: "TYPE_OF_FOOD.PIZZA" },
            { _id: "360", type_of_food: "TYPE_OF_FOOD.SANDWICHES" },
            { _id: "370", type_of_food: "TYPE_OF_FOOD.SUSHI" },
            { _id: "380", type_of_food: "TYPE_OF_FOOD.VEGANISM" }
        ];
        types.forEach((type: TypeOfFood) => { TypesOfFood.insert(type) });
    }
}