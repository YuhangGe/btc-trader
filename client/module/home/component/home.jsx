import React from 'react';
import {
  I18n
} from 'i18n';

export default class Home extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="home">
        <I18n t="home.welcome" />
      </div>
    );
  }
}