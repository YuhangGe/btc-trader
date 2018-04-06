import {
  UIRouterReact,
  BrowserLocationConfig,
  servicesPlugin,
  pushStateLocationPlugin
} from '@uirouter/react';
import env from './env';

// 此处是一种 hack 的方法，强制设置 ui-router 的 base 为 
// env.SERVER_ROOT，而不是从 <base/> 元素取。
// 因为 base 元素是用于静态文件的。
BrowserLocationConfig.prototype.applyDocumentBaseHref = function() {
  return this._baseHref = env.URL_SERVER_ROOT;
};

const router = new UIRouterReact();

router.plugin(servicesPlugin);
router.plugin(pushStateLocationPlugin);

const originErrorHandler = router.stateService._defaultErrorHandler;

router.stateService.defaultErrorHandler(err => {
  // if (err.message && err.message === 'The transition has been superseded by a different transition') {
  //   return;
  // }
  originErrorHandler(err);
});

export default router;
