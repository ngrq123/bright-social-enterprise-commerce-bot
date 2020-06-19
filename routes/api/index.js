var router = require('express').Router();

router.use('/', require('./webhooks'));
router.use('/test', require('./test'));


module.exports = router;