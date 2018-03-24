import { Languages } from '../../../../both/collections/general/language.collection';
import { Language } from '../../../../both/models/general/language.model';

export function loadLanguages(){
    if(Languages.find().cursor.count() === 0){
        const languages: Language[] = [{
            _id: "1000",
            is_active: true,
            language_code: 'es',
            name: 'Español',
            image: null
        },{
            _id: "2000",
            is_active: true,
            language_code: 'en',
            name: 'English',
            image: null
        },{
            _id: "3000",
            is_active: false,
            language_code: 'fr',
            name: 'Français',
            image: null
        },{
            _id: "4000",
            is_active: false,
            language_code: 'pt',
            name: 'Portuguese',
            image: null
        },{
            _id: "5000",
            is_active: false,
            language_code: 'it',
            name: 'Italiano',
            image: null
    }/*,{
            _id: "6000",
            is_active: true,
            language_code: 'al',
            name: 'Deutsch',
            image: null
        }*/
        ];

        languages.forEach((language : Language) => Languages.insert(language));
    }
}