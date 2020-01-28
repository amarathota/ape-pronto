import File from './file'
import Log from './log'

let instance
class Util {
  constructor() {
    if (!instance) {
      instance = this
      this.file = new File()
      this.log = new Log()
    }
    return instance
  }
}

module.exports = Util
