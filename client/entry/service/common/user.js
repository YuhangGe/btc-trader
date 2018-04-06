import env from 'env';
import findIndex from 'lodash-es/findIndex';
import isFunction from 'lodash-es/isFunction';

class User {
  constructor(info) {
    this.username = info.username;
    this.nickname = info.nickname;
    this.id = info.id;
    this.locale = info.locale || env.DEFAULT_LANGUAGE;
    this.theme = info.theme || env.DEFAULT_THEME;
    this.privileges = info.privileges || [];
    window.localStorage.setItem('LOCALE', this.locale);
  }
  update(info = {}) {
    if (info.locale && this.locale !== info.locale) {
      window.localStorage.setItem('LOCALE', info.locale);
    }
    Object.assign(this, info);
  }
  /*
   * 鉴定是否满足全部权限。
   * 参数为待检测的权限数组，数组每一个元素是一个权限；
   *   数组的元素也可以是一个数组，
   *   代表该子数组需要满足至少一个权限。
   */
  hasAllPrivileges(privileges) {
    for(let i = 0; i < privileges.length; i++) {
      const priv = privileges[i];
      if (Array.isArray(priv)) {
        if (!this.hasAnyPrivilege(priv)) {
          return false;
        }
      } else if (!this.hasPrivilege(priv)) {
        return false;
      }
    }
    return true;
  }
  /*
   * 鉴定是否满足至少一个权限。
   * 参数为待检测的权限数组，数组每一个元素是一个权限；
   *   数组的元素也可以是一个数组，
   *   代表该子数组需要满足全部权限。
   */
  hasAnyPrivilege(privileges) {
    for(let i = 0; i < privileges.length; i++) {
      const priv = privileges[i];
      if (Array.isArray(priv)) {
        if (this.hasAllPrivileges(priv)) {
          return true;
        }
      } else if (this.hasPrivilege(priv)) {
        return true;
      }
    }
    return false;
  }
  /*
   * 参数是一个权限字符串，用于判断是否具备该权限
   * 参数可以是末尾带 * 的模糊匹配，
   *   用来表示以该字符串打头的任何权限。
   * 参数可以是一个正则表达式
   * 参数可以是一个函数，用于动态判断
   * @example
   *
   * const user = config._global.user;
   * const hasP = user.hasAllPrivileges(
   *   'p1', 'p2',
   *   ['p3', 'p4'],
   *   /^bi\.(self|any)\.read\.all$/
   *   'manage.user.*',
   *   t => /^user\.\w+\.read/.test(t)
   * );
   *
   * 以上示例要求，
   *   拥有 p1, p2 权限，
   *   并且至少拥有 p3 或 p4 权限
   *   并且至少拥有一个满足正则表达式 /^bi\.(self|any)\.read\.all$/ 的权限
   *   并且拥有以 manage.user. 打头的任何一个权限
   *   并且拥有至少一个满足 /^user\.\w+\.read/ 的权限
   */
  hasPrivilege(privilege) {
    if (isFunction(privilege)) {
      return findIndex(this.privileges, m => privilege(m)) >= 0;
    } else if (privilege instanceof RegExp) {
      return findIndex(this.privileges, m => privilege.test(m)) >= 0;
    } else if (privilege.endsWith('.*')) {
      privilege = privilege.substring(0, privilege.length - 1);
      return findIndex(this.privileges, m => m.startsWith(privilege)) >= 0;
    } else {
      return this.privileges.indexOf(privilege) >= 0;
    }
  }
}

// 单例模式
export default new User(window.__AppBootInfo.user);
