const assert = require('node:assert/strict');
const Module = require('node:module');
const test = require('node:test');

process.env.PORT = '0';
process.env.TOKEN = 'test-token';

const core = {
  configure: () => {},
  fetchPlaylist: async () => '#EXTM3U\n#EXTINF:5,\nhttps://media.example/segment.aac\n#EXT-X-ENDLIST\n',
};
const load = Module._load;
Module._load = (request, parent, isMain) => (
  request === 'radichu-core' ? core : load(request, parent, isMain)
);
let app;
try {
  app = require('../app');
} finally {
  Module._load = load;
}

test('serves the complete core playlist without changing its body', async (t) => {
  const listener = app.listen(0);
  t.after(() => new Promise((resolve, reject) => {
    listener.close((error) => (error ? reject(error) : resolve()));
  }));
  await new Promise((resolve) => listener.once('listening', resolve));

  const { port } = listener.address();
  const url = `http://127.0.0.1:${port}/play/BAYFM78/20260101000000/20260101001000/playlist.m3u8?token=test-token`;
  const response = await fetch(url);

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/vnd\.apple\.mpegurl/);
  assert.equal(await response.text(), await core.fetchPlaylist());
});
