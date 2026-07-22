const bunyan = require('bunyan');
const app = require('./app');
const config = require('./config');

const logger = bunyan.createLogger({ name: 'radichu-serve' });
const listener = app.listen(config.port, () => {
  logger.info(`Listening on port ${listener.address().port}!`);
});
