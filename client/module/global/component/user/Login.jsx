import React from 'react';
import {
  WingBlank,
  List, WhiteSpace,
  InputItem,
  Toast,
  Button
} from 'antd-mobile';
import {
  hashPassword,
  validateForm, validateField
} from 'util';
import router from 'router';
import env from 'env';
import user from 'user';

export default class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      form: {
        username: {
          value: '',
          placeholder: '用户名',
          require: true,
          requireTip: '请输入用户名'
        },
        password: {
          value: '',
          placeholder: '密码',
          require: true,
          requireTip: '请输入密码'
        }
      }
    };
  }
  _updateField(fieldName, value) {
    const form = this.state.form;
    form[fieldName].value = value;
    this.setState({
      form
    });
  }
  _validateField(fieldName) {
    const form = this.state.form;
    validateField(form[fieldName]);
    this.setState({
      form
    });
  }
  _validateAll() {
    const form = this.state.form;
    const pass = validateForm(form);
    this.setState({
      form
    });
    return pass;
  }
  submit() {
    if (this.state._submitting || !this._validateAll()) {
      logger.log('not validate');
      return;
    }
    this.setState({
      _submitting: true
    });
    const form = this.state.form;
    hashPassword(form.password.value).then(pwd => {
      return fetch('global/user/login', {
        method: 'POST',
        data: {
          username: form.username.value,
          password: pwd
        }
      });
    }).then(info => {
      this.setState({
        _submitting: false
      });
      const needReload = info.locale && user.locale !== info.locale;
      user.update(info);
      this.jump(needReload);
    }, err => {
      logger.error(err);
      Toast.fail('登录失败！', err.message);
      this.setState({
        _submitting: false
      });
    });
  }
  _clearFieldError(fieldName) {
    const form = this.state.form;
    form[fieldName].error = null;
    this.setState({
      form
    });
  }
  _toastError(fieldName) {
    Toast.fail(this.state.form[fieldName].error);
  }
  jump(reload) {
    window.history.replaceState(
      null,
      null,
      router.globals.params.url || env.SERVER_ROOT
    );
    reload && setTimeout(() => {
      window.location.reload(true);
    });
  }
  render() {
    const form = this.state.form;

    return (
      <div className="login-page">
        <WingBlank>
          <h2>BTC-Trader</h2>          
          <List renderHeader={() => '登录'}>
            <InputItem
              placeholder="请输入用户名"
              error={form.username.error}
              onErrorClick={this._toastError.bind(this, 'username')}
              onChange={this._updateField.bind(this, 'username')}
              onBlur={this._validateField.bind(this, 'username')}
              onKeyDown={this._clearFieldError.bind(this, 'username')}
              value={form.username.value}
            >用户名</InputItem>
            <InputItem
              type="password"
              placeholder="请输入密码"
              error={form.password.error}
              onErrorClick={this._toastError.bind(this, 'password')}
              onChange={this._updateField.bind(this, 'password')}
              onBlur={this._validateField.bind(this, 'password')}
              onKeyDown={this._clearFieldError.bind(this, 'password')}
              value={form.password.value}
            >密码</InputItem>
          </List>
          <WhiteSpace/>
          <Button
            type="primary"
            onClick={this.submit.bind(this)}
          >登录</Button>
        </WingBlank>
      </div>
    );
  }
}