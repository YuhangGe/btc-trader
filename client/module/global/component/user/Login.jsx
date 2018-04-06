import React from 'react';
import {
  TextField,
  PrimaryButton,
  Link,
  Spinner,
  SpinnerSize
} from 'fabric';
import {
  UISref
} from '@uirouter/react';
import {
  hashPassword,
  validateForm, validateField,
  fetch
} from 'util';
import router from 'router';
import user from 'user';
import message from 'message';

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
      user.update(Object.assign({
        username: form.username.value
      }, info));
      const params = router.globals.params;
      router.stateService.go(params.returnState || 'join', params.returnParams || null, {
        location: 'replace'
      });
    }, err => {
      logger.error(err);
      message.error('登录失败！', err.message);
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
  render() {
    const form = this.state.form;

    return (
      <div className="login-layer">
        <div className="login-form">
          <div className="title">
            <h2>登录</h2>
            <div className="jump">
              <UISref to="register">
                <Link>注册账户</Link>
              </UISref>
            </div>
          </div>
          <TextField
            onChanged={this._updateField.bind(this, 'username')}
            onGetErrorMessage={this._validateField.bind(this, 'username')}
            value={form.username.value}
            onKeyDown={this._clearFieldError.bind(this, 'username')}
            validateOnLoad={false}
            validateOnFocusOut={true}
            errorMessage={form.username.error}
            placeholder={form.username.placeholder}
          />
          <TextField
            onChanged={this._updateField.bind(this, 'password')}
            onGetErrorMessage={this._validateField.bind(this, 'password')}
            onKeyDown={this._clearFieldError.bind(this, 'password')}
            value={form.password.value}
            validateOnLoad={false}
            validateOnFocusOut={true}
            type="password"
            errorMessage={form.password.error}
            placeholder={form.password.placeholder}
          />
          <PrimaryButton className={this.state._submitting ? 'loading' : ''}
            onClick={this.submit.bind(this)}>
            {this.state._submitting ? (<Spinner size={SpinnerSize.small} />) : null}
            <span>登录</span>
          </PrimaryButton>
        </div>
      </div>
    );
  }
}