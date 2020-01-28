import fs from 'fs'
import path from 'path'

class FileUtil {
  readIfFile(file) {
    try {
      let stat = fs.statSync(file)
      if (stat.isFile()) {
        let content = fs.readFileSync(file, {
          encoding: "utf-8"
        })
        return content
      }
    } catch (e) {
      return false
    }
  }

  createPath(dir) {
    let parts = dir.split(path.sep)
    for (let i = 1; i <= parts.length; i++) {
      try {
        fs.mkdirSync(path.join.apply(null, parts.slice(0, i)))
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e
        }
      }
    }
  }

  writeFile(dir, file, content) {
    this.createPath(dir)
    fs.writeFileSync(path.join(dir, file), content)
  }

  appendFile(dir, file, content) {
    this.createPath(dir)
    fs.appendFileSync(path.join(dir, file), content)
  }

  getDirs(src) {
    return fs.readdirSync(src).filter(file => {
      return fs.statSync(path.join(src, file)).isDirectory();
    });
  }
}

module.exports = FileUtil
