class LogUtil {
  error(message = 'Unspecified error occurred', error) {
    Error.stackTraceLimit = 8
    if (!process.env.NODE_ENV) {
      console.log(message, error.stack)
    } else {
      console.log(message, error.message)
    }
  }
}

module.exports = LogUtil
