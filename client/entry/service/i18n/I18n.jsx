import React from 'react';
import { t } from './service';

class I18n extends React.Component {
  render() {
    return <span>{t(this.props.t, this.props.p)}</span>;
  }
}
export default I18n;

