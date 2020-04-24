const express = require('express');
const bunyan = require('bunyan');
const radichuCore = require('radichu-core');
const config = require('./config');

const logger = bunyan.createLogger({ name: 'radichu-serve' });

radichuCore.configure(config.radichuCore);

const app = express();
app.disable('x-powered-by');

app.get('/', (req, res) => res.send('Hello World!'));

const authBasic = (req, res, next) => {
  if (!req.header.Authorization) {
    res.header('WWW-Authenticate', 'Bearer realm="Restricted Area"');
    return res.sendStatus(401);
  }
  const rgx = /^Bearer (.+)$/;
  const matches = rgx.exec(req.header.Authorization);
  if (!matches || matches[1] !== config.token) return res.sendStatus(403);
  return next();
};

app.get(authBasic, '/play/:stationId/:ft/:to/playlist.m3u8', async (req, res) => {
  const {
    stationId,
    ft,
    to,
  } = req.params;

  try {
    const playlistBody = await radichuCore.fetchPlaylist(stationId, ft, to);
    res.contentType('application/vnd.apple.mpegurl');
    return res.send(playlistBody);
  } catch (e) {
    logger.error(e);
    res.status(400);
    return res.send(e.message);
  }
});

const listener = app.listen(config.port, () => {
  logger.info(`Listening on port ${listener.address().port}!`);
});
