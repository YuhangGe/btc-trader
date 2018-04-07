require('./service/watcher');

const { 
  Router,
  authorize
} = require(__framework);
const router = new Router({
  prefix: '/trade'
});
router.use(authorize());

module.exports = router;