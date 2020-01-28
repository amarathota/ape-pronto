import fs from 'fs'
import path from 'path'
import config from 'config'
import stylus from 'stylus'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer-core'
import * as babel from 'babel-core'
import * as uglify from 'uglify-js'
import Util from './util/index'
// CSS pre-processor is pluggable
import compileCSS from './pronto-stylus';
let util = new Util()

let root = config.get('pronto.root')
let staticDebugDir = config.get("pronto.static_debug_dir")
let staticDebugUrl = config.get("pronto.static_debug_url")
let staticProdDir = config.get("pronto.static_prod_dir")
let staticProdUrl = config.get("pronto.static_prod_url")
let staticProdCSSFile = config.get("pronto.static_prod_css_file")
let staticProdJSFile = config.get("pronto.static_prod_js_file")

let instance
class AssetProcessor {
  scriptCompilation = ''
  concatenateResources = ''
  scripts = []
  styles = []

  constructor() {
    if (!instance) {
      this.init()
      instance = this
    }
    return instance  }

  init() {
    // Load script compilation settings if they exist.
    try {
      this.scriptCompilation = config.get("pronto.script_compilation")
    } catch (e) {
      this.scriptCompilation = {}
    }

    // Determine if resources should be concatenated
    if (typeof this.scriptCompilation.concatenate === 'boolean') {
      this.concatenateResources = this.scriptCompilation.concatenate
    } else {
      // TODO: This is to support legacy configurations without the scriptCompilation block
      // and 'concatenate' field set.
      this.concatenateResources = process.env.NODE_ENV === 'production'
    }

    // Unlink the combined files
    try {
      fs.unlinkSync(path.join(root, staticProdDir, staticProdCSSFile))
      fs.unlinkSync(path.join(root, staticProdDir, staticProdJSFile))
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e
      } else {
        console.info("Prod static files not found...ignorable")
      }
    }
  }


  processStyles(basePath, name, fileInput, fileOutput) {
    // dev block
    let content = util.file.readIfFile(path.join(basePath, fileInput))
    let styleFile = path.join(name, fileInput)

    // Stylus
    let output = compileCSS(content, styleFile);

    // Prefix
    output = postcss([autoprefixer]).process(output).css

    // write file
    util.file.writeFile(path.join(root, staticDebugDir, name), fileOutput, output)

    // prod block
    // minify
    // append to prod file
    util.file.appendFile(path.join(root, staticProdDir), staticProdCSSFile, output)

    if (this.concatenateResources) {
      this.styles = path.join(staticProdUrl, staticProdCSSFile)
    } else {
      this.styles.push(path.join(staticDebugUrl, name, fileOutput))
    }
  }

  processScripts(basePath, name, file) {
    // dev block
    let content = util.file.readIfFile(path.join(basePath, file))
    let output = content;

    if (this.scriptCompilation.babel) {
      output = babel.transform(output).code
    }

    if (this.scriptCompilation.uglify) {
      output = uglify.minify(output, {
        fromString: true
      }).code
    }

    // Some build steps here link linting etc.
    util.file.writeFile(path.join(root, staticDebugDir, name), file, output)
    util.file.appendFile(path.join(root, staticProdDir), staticProdJSFile, output)

    if (this.concatenateResources) {
      this.scripts = path.join(staticProdUrl, staticProdJSFile)
    } else {
      this.scripts.push(path.join(staticDebugUrl, name, file))
    }
  }
}

module.exports = AssetProcessor
