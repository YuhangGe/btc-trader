import React from 'react';
import router from 'router';
import {
  UIRouter,
  UIView,
} from '@uirouter/react';

export default function createRootApp() {
  return (
    <UIRouter router={router}>
      <UIView/>
    </UIRouter>
  );
}
