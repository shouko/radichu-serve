const fs = require('fs');
const path = require('path');
const { execFile, execFileSync } = require('child_process');
// const { EventEmitter } = require('events');
const config = require('../../config');

const confPath = path.join(__dirname, 'rclone.conf');
const credsPath = path.join(__dirname, 'creds.json');
const binPath = path.join(__dirname, 'rclone');

try {
  fs.statSync(confPath);
} catch (e) {
  fs.writeFileSync(confPath, config.rclone.config);
}

try {
  fs.statSync(credsPath);
} catch (e) {
  fs.writeFileSync(credsPath, config.rclone.creds);
}

const confBody = fs.readFileSync(confPath, 'utf8');
const remoteName = confBody.substr(1, confBody.indexOf(']') - 1);

class RcWriteable {
  constructor(fullPath) {
    this.localTmpDir = execFileSync('mktemp -d').toString().trim();
    this.dirname = path.dirname(fullPath);
    this.basename = path.basename(fullPath);
    this.stream = fs.createWriteStream(`${this.localTmpDir}/${this.basename}`);
  }

  write(chunk) {
    return this.stream.write(chunk);
  }

  async end() {
    return new Promise((resolve, reject) => {
      this.stream.on('finish', () => {
        execFile(
          binPath,
          ['move', `${this.localTmpDir}/${this.basename}`, `${remoteName}:${this.dirname}`],
          { cwd: __dirname },
          (error, stdout, stderr) => {
            if (error) reject(error);
            resolve({ stdout, stderr });
          },
        );
      });
      this.stream.end();
    });
  }
}

const createWriteStream = (fullPath) => new RcWriteable(fullPath);

const stat = async (fullPath) => new Promise((resolve) => {
  execFile(
    binPath,
    ['lsjson', `${remoteName}:${fullPath}`],
    {},
    (error, stdout) => {
      if (error) resolve(false);
      try {
        const res = JSON.parse(stdout);
        if (Array.isArray(res) && res.length > 0) resolve(true);
        resolve(false);
      } catch (e) {
        resolve(false);
      }
    },
  );
});

module.exports = {
  createWriteStream,
  stat,
};
