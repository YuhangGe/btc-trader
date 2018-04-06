import isNumber from 'lodash-es/isNumber';
import isObject from 'lodash-es/isObject';
import isFunction from 'lodash-es/isFunction';
import isUndefined from 'lodash-es/isUndefined';

const EMAIL_REGEXP = /^[-a-z0-9~!$%^&*_=+}{'?]+(\.[-a-z0-9~!$%^&*_=+}{'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i;

function regexp(r, val) {
  return r.test(val);
}

function pattern(regexp, val) {
  return regexp.test(val);
}
function rangeLength(min, max, val) {
  return val.length >= min && val.length <= max;
}

function length(len, val) {
  return val.length === len;
}

function minLength(min, val) {
  return val.length >= min;
}

function maxLength(max, val) {
  return val.length <= max;
}

function min(min, val) {
  val = isNumber(val) ? val : Number(val);
  return val >= min;
}

function max(max, val) {
  val = isNumber(val) ? val : Number(val);
  return val <= max;
}

function range(min, max, val) {
  val = isNumber(val) ? val : Number(val);
  return val >= min && val <= max;
}

function email(val) {
  return pattern(EMAIL_REGEXP, val);
}

export const validators = {
  regexp,
  pattern,
  range,
  min,
  max,
  rangeLength,
  minLength,
  maxLength,
  length,
  email
};

export function validateField(field) {
  field.error = null; // clear error
  const v = field.value;
  if (field.require &&
    (isUndefined(v) || v === null || (typeof v === 'string' && !v.trim()))) {
    field.error = field.requireTip || '该字段不能为空';
    return false;
  }
  if (!Array.isArray(field.rules) || field.rules.length === 0) {
    return true;
  }
  for (let i = 0; i < field.rules.length; i++) {
    const r = field.rules[i];
    if (!isObject(r) || isFunction(r)) {
      console.error(r);
      throw new Error('校验规则配置不正确');
    }
    let pass = true;
    if (isFunction(r.fn)) {
      pass = r.fn(v);
    } else if (r.name && validators.hasOwnProperty(r.name)) {
      const argv = Array.isArray(r.argv) ? r.argv : (isUndefined(r.argv) ? [] : [r.argv]);
      pass = validators[r.name](...argv, v);
    } else {
      console.error(r);
      throw new Error('未知校验规则：' + r.name);
    }
    if (!pass) {
      field.error = r.tip || '该字段格式不正确';
      return false;
    }
  }
  return true;
}

export function validateForm(form, skipAfter = false) {
  let allPass = true;
  for (const fieldName in form) {
    const pass = validateField(form[fieldName]);
    if (!pass) {
      console.log(fieldName + ' not validate');
      allPass = false;
      if (skipAfter) break;
    }
  }
  return allPass;
}