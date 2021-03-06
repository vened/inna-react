import {getStore} from '../../store/storeHolder';
import {isInsideRf} from '../../helpers/tripHelper';

//const requireFields = (...names) => data =>
//    names.reduce((errors, name) => {
//        if (!data[name]) {
//            errors[name] = 'Required';
//        }
//        return errors;
//    }, {});
//const validateAddress = requireFields('street', 'city');
//const validateChild = requireFields('name', 'age');

const validateForm = data => {
  //console.log('validateForm', data);
  const errors = {};
  
  var aviaInfo = null;
  var state = getStore().getState();
  if (state.reservation && state.reservation.AviaInfo) {
    aviaInfo = state.reservation.AviaInfo;
  }
  
  var isMobile, expireDateTo;
  var {validation} = data;
  if (validation) {
    isMobile = validation.isMobile;
    expireDateTo = validation.expireDateTo;
  }
  
  if (!data.email) {
    errors.email = 'Нужно ввести email';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(data.email)) {
    errors.email = 'Неправильный email';
  }
  
  if (!data.phone) {
    errors.phone = 'Нужно ввести телефон';
  }
  
  //agree
  if (!data.Agree) {
    errors.Agree = 'Нужно согласиться с условиями';
  }
  
  if (data.passengers) {
    errors.passengers = [];
    data.passengers.forEach((pas, ix)=> {
      errors.passengers[ix] = {};
      
      if (!pas.gender) {
        errors.passengers[ix].gender = 'Пол';
      }
      if (!pas.name) {
        errors.passengers[ix].name = 'Введите имя';
      }
      if (!pas.lastName) {
        errors.passengers[ix].lastName = 'Введите фамилию';
      }
      
      if (!pas.birth) {
        errors.passengers[ix].birth = 'Введите дату рождения';
      }
      else if (!validateBirth(pas.birth)) {
        errors.passengers[ix].birth = 'Некорректная дата рождения';
      }
      
      if (!pas.citizenship) {
        errors.passengers[ix].citizenship = 'Введите гражданство';
      }
      if (!pas.docType && pas.docType != 0) {
        errors.passengers[ix].docType = 'Введите тип док.';
      }
      
      //номер документа
      if (!pas.docNumber) {
        errors.passengers[ix].docNumber = 'Введите номер док.';
      }
      else {
        //console.log('pas.docType', pas.docType, pas.citizenship);
        //зависит от типа документа
        switch (pas.docType) {
          case 0:
            //10 цифр - российский паспорт
            if (!/^(\d{10})+$/.test(pas.docNumber)) {
              errors.passengers[ix].docNumber = 'Неправильный номер';
            }
            break;
          case 1:
            //9 цифр - загранпаспорт
            if (!/^(\d{9})+$/.test(pas.docNumber)) {
              errors.passengers[ix].docNumber = 'Неправильный номер';
            }
            break;
          case 2:
            //строка символов(латинских)-строка символов(русских)+6цифр
            //Проверять что первая строка латинские символы, вторая строка русские символы
            //например, I-МЮ №134567 или XIV-РН №345678
            if (!/^.*([a-zA-Z]).*([а-яА-ЯёЁ])(\D)*(\d{6})+$/.test(pas.docNumber)) {
              errors.passengers[ix].docNumber = 'Неправильный номер';
            }
            break;
          case 3:
            if (!pas.docNumber) {
              errors.passengers[ix].docNumber = 'Неправильный номер';
            }
            break;
        }
      }
      
      //doc expire
      var dontValidateDocExpire = false;
      if ((pas.docType == 0 || pas.docType == 2) && pas.citizenship) {
        //Россия
        if (pas.citizenship == 189) {
          if (aviaInfo) {
            //если поездка по России
            if (isInsideRf(aviaInfo)) {
              dontValidateDocExpire = true;
            }
          }
        }
      }
      
      if (!dontValidateDocExpire) {
        if (!pas.docExpires) {
          errors.passengers[ix].docExpires = 'Введите дату';
        }
        else {
          var valExp = validateExpire(pas.docExpires, expireDateTo);
          var {expireResult, expireFlag} = valExp;
          if (!expireResult) {
            errors.passengers[ix].docExpires = 'Некорректная дата';
          }
          else if (expireFlag) {
            errors.passengers[ix].docExpires = 'Срок действия истек';
          }
        }
      }
      //console.log('errors.passengers[ix]', errors.passengers[ix]);
    })
  }
  
  //errors.shipping = validateAddress(data.shipping);
  //errors.billing = validateAddress(data.billing);
  //errors.children = data.children.map(validateChild);
  
  return errors;
};

function validateBirth(s) {
  if (!/^(\d{2})+\.(\d{2})+\.(\d{4})+$/.test(s)) return false;//18.07.1976
  
  //от 01.01.1900 до текущей даты
  var dParts = s.split('.');
  var isDayTrue;
  var isMonthTrue;
  var isYearTrue;
  
  if (dParts.length == 3) {
    var y = parseInt(dParts[2], 10);
    var day = parseInt(dParts[0], 10);
    var month = parseInt(dParts[1], 10);
    var today = new Date();
    var yyyy = today.getFullYear();
    
    //если дата рождения больше текущей даты
    var valDate = new Date(y, (month - 1), day);
    //console.log('valDate:', +valDate);
    //console.log('today  :', +today);
    if (+valDate > +today) {
      return false;
    }
    
    if (!(day >= 1 && day <= 31)) {
      return false;
    } else {
      isDayTrue = true;
    }
    
    if (!(month >= 1 && month <= 12)) {
      return false;
    } else {
      isMonthTrue = true;
    }
    
    if (!(y >= 1900 && y <= yyyy)) {
      return false;
    } else {
      isYearTrue = true;
    }
    
    if (isDayTrue && isMonthTrue && isYearTrue) {
      return true;
    }
  }
  
  return true;
}

function validateExpire(s, expireDateTo) {
  var falseResult = {expireResult: false, expireFlag: false};
  var falseExpireResult = {expireResult: true, expireFlag: true};
  var trueResult = {expireResult: true, expireFlag: false};
  
  if (!/^(\d{2})+\.(\d{2})+\.(\d{4})+$/.test(s)) return falseResult;//18.07.1976
  
  //Дата должна быть в диапазоне от текущей даты + 100 лет
  var dParts = s.split('.');
  if (dParts.length == 3) {
    var y = parseInt(dParts[2], 10);
    
    var day = parseInt(dParts[0], 10);
    if (!(day >= 1 && day <= 31))
      return falseResult;
    var month = parseInt(dParts[1], 10);
    if (!(month >= 1 && month <= 12))
      return falseResult;
    
    var yyyy;
    if (expireDateTo) {
      //если дата вообще меньше текущей
      var testDate = new Date(y, month - 1, day);
      //console.log('expire', s, testDate, expireDateTo);
      if (+testDate < +expireDateTo) {
        return falseExpireResult;
      }
      
      yyyy = expireDateTo.getFullYear();
      if (!(y >= yyyy && y <= (yyyy + 100)))
        return falseResult;
    }
    else {
      var today = new Date();
      
      //если дата вообще меньше текущей
      var testDate = new Date(y, month - 1, day);
      //console.log('expire', s, testDate, today);
      if (+testDate < +today) {
        return falseExpireResult;
      }
      
      yyyy = today.getFullYear();
      if (!(y >= yyyy && y <= (yyyy + 100)))
        return falseResult;
    }
  }
  
  return trueResult;
}

export default validateForm;
