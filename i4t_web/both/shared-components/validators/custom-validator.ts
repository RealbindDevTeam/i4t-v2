import { AbstractControl } from "@angular/forms";

export class CustomValidators {

  public static emailValidator(control: AbstractControl) {
    if (control.value.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])+?/)) {
      return null;
    } else {
      return { 'invalidEmailAddress': true };
    }
  }

  /*
  public static numericValidator(control: AbstractControl) {
    if (control.value.match(/^(0|[1-9][0-9]*)$/)) {
      return null;
    } else {
      return { 'invalidNumericField': true };
    }
  }
  */
  public static numericValidator(control: AbstractControl) {
    if (control.value.match(/^\d+$/)) {
      return null;
    } else {
      return { 'invalidNumericField': true };
    }
  }

  public static letterValidator(control: AbstractControl) {
    if (control.value.match(/^[A-z]+$/)) {
      return null;
    } else {
      return { 'invalidLetterField': true };
    }
  }

  public static letterSpaceValidator(control: AbstractControl) {
    if (control.value.match(/^[a-zA-Z\s]*$/)) {
      return null;
    } else {
      return { 'invalidLetterSpaceField': true };
    }
  }

  public static dayOfDateValidator(control: AbstractControl) {
    if (control.value >= 1 && control.value <= 31) {
      return null;
    } else {
      return { 'invalidDayField': true };
    }
  }

  public static monthOfDateValidator(control: AbstractControl) {
    if (control.value >= 1 && control.value <= 12) {
      return null;
    } else {
      return { 'invalidMonthField': true };
    }
  }

  public static yearOfDateValidator(control: AbstractControl) {
    if (control.value >= 1970) {
      return null;
    } else {
      return { 'invalidYearField': true };
    }
  }

  public static noSpacesValidator(control: AbstractControl) {
    if(control.value !== null && control.value !== undefined){
      if (control.value.match(/^\S*$/)) {
        return null;
      } else {
        return { 'invalidNoSpacesValidator': true };
      }
    }
  }

  /*Password constraints
    min 6 characters
    max 20 characters
    lower and upper letters
    numbers
    allowed characters !@#$%^&*
  */
  /*public static passwordValidator(control: AbstractControl) {
	    if (control.value.match(/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,20}$/)) {
	      return null;
	    } else {
	      return {'invalidPassword': true };
	    }
  }*/
} 