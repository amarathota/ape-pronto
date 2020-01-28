import dust from 'dustjs-helpers'
import AssetProcessor from './asset-processor'
let assetProcessor = new AssetProcessor()

class DustHelper {
  renderMethod(name, data, templateVars) {
    data = data || {}
    // TODO fix! send to render maybe?
    data.styles = assetProcessor.styles
    data.scripts = assetProcessor.scripts

    for (let variable in templateVars) {
      data[variable] = templateVars[variable]
    }

    let out
    dust.render(name, data, function(error, output) {
      if (error) {
        console.info(error)
      } else {
        out = output
      }
    });
    return out
  }

  compileMethod(content, templateName) {
    // Load in and compile the templates in the view's dir using dust.
    let compiledTemplate = dust.compile(content, templateName)
    dust.loadSource(compiledTemplate)
  }
}

module.exports = DustHelper
