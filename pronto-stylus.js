import stylus from 'stylus'

module.exports = function(content, styleFile) {
  var output = ''
  stylus.render(content, {
    filename: styleFile
  }, function(err, css) {
    if (err) {
      throw err
    }

    output = css
  });
  return output
}
