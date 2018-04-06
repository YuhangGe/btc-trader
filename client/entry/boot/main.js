import '../service/common/polyfill';
import allModules from './module';
import router from './router';
import ReactDOM from 'react-dom';
import createRootApp from '../../module/global/component/layout/RootApp';
import { $id, browser } from 'util';

function checkBrowser() {
  if (browser.is.chrome && browser.version >= 57) return true;
  if (browser.is.firefox && browser.version >= 52) return true;
  if (browser.is.safari && browser.version >= 9) return true;
  $id('splash_screen').innerHTML = `
<p class="browser-tip" style="padding: 50px 15px;font-size: 25px;">
暂不支持您所用的浏览器<br/>请下载并使用最新版本的
<a style="color: #2488d8;" href="https://www.baidu.com/s?wd=chrome%E6%B5%8F%E8%A7%88%E5%99%A8" target="_blank">Chrome</a>
浏览器
</p>`;
}

function initRoute() {
  const DefaultAppStates = [{
    name: 'default',
    url: '/',
    redirectTo: 'home'
  }];
  
  const AppStates = allModules.reduce((p, m) => {
    return m.States ? p.concat(m.States) : p;
  }, DefaultAppStates);
  
  AppStates.forEach(state => router.stateRegistry.register(state));
  router.urlRouter.otherwise('/');
}
export default function bootstrap() {
  if (!checkBrowser()) return;
  initRoute();
  const RootApp = createRootApp();
  ReactDOM.render(RootApp, $id('app-react-container'));
  let $s = $id('splash_screen_style');
  $s.parentElement.removeChild($s);
  $s = $id('splash_screen');
  $s.parentElement.removeChild($s);
}

window.__AppBootInfo.bootstrap = bootstrap;
