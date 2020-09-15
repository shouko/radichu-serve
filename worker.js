const Queue = require('better-queue');
const radichuCore = require('radichu-core');
const { Readable, Writable } = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const rclone = require('./services/rclone');

ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const q = new Queue(async ({ stationId, ft, to }, cb) => {
  try {
    const fn = `${ft}-${to}-${stationId}.aac`;
    const dir = ft.substr(0, 6);
    const fullPath = `${dir}/${fn}`;
    const exists = await rclone.stat(fullPath);
    if (exists) return cb(null);
    const source = Readable.from(await radichuCore.fetchPlaylist(stationId, ft, to));
    const remote = rclone.createWriteStream(fullPath);
    const output = new Writable({
      write(chunk, encoding, next) {
        remote.write(chunk);
        next();
      },
    });
    ffmpeg.input(source)
      .inputOptions(['-protocol_whitelist', 'file,pipe,https,tls,tcp', '-f', 'hls'])
      .audioCodec('copy')
      .output(output)
      .on('error', (err, stdout, stderr) => {
        cb(err, { stdout, stderr });
      })
      .on('end', async () => {
        await remote.end();
        cb(null);
      })
      .run();
  } catch (e) {
    return cb(e);
  }
  return false;
});

const push = async (input) => new Promise((resolve, reject) => {
  q.push(input)
    .on('finished', (res) => resolve(res))
    .on('failed', (err) => reject(err));
});

module.exports = {
  push,
};
