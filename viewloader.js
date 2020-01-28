// Pronto View Loader. Central module for loading component assets
import config from 'config'
import fs from 'fs'
import path from 'path'
import Util from './util/index'
let util = new Util()

// asset processor is pluggable
import AssetProcessor from './asset-processor'
let assetProcessor = new AssetProcessor()

// view engine is pluggable
let ViewEngine
if (util.file.readIfFile( __dirname + '/../../' + config.get('pronto.view_engine'))) {
  ViewEngine = require('../../' + config.get('pronto.view_engine'));
} else {
  ViewEngine = require('./pronto-dust');
}

let viewEngine = new ViewEngine();

let instance
class ViewLoader {

  // Retrive the config values
  partialsDir = config.get('pronto.partials_dir')
  root = config.get('pronto.root')
  templateDir = config.get('pronto.template_dir')
  stylesDir = config.get('pronto.styles_dir')
  scriptsDir = config.get('pronto.scripts_dir')
  vc = config.get('pronto.vc')
  templateVars = config.get('pronto.template_vars')
  viewDirs = []
  views = []

  constructor() {
      if (!instance) {
        this.init()
        instance = this
      }
      return instance
    }
    // walk view directories, load view into array depending on vieEngine's load method.
    init() {
      this.resolveViewDirs()
      this.loadComponents()
      console.log(`Loading ${this.partialsDir}`)
      this.loadTemplates(path.resolve(path.join(this.root, this.partialsDir)), this.partialsDir, this.templateDir)
    }

    // look at viewDirs config, resolve children
    resolveViewDirs() {
      let configDirs = config.get('pronto.view_dirs')
      for (let dir of configDirs) {
        if (dir.path.indexOf('*') > 0) {
          let clean = dir.path.substring(0, dir.path.length - 2)
          let pathToDir = path.join(this.root, clean)
          let subDirs =  util.file.getDirs(pathToDir)
          subDirs = subDirs.map( dir => {
            return {path: `${clean}/${dir}/`}
          })
          this.viewDirs = this.viewDirs.concat(subDirs)
        } else {
          this.viewDirs.push(dir)
        }
      }
    }


    loadComponents() {
      for (let view of this.viewDirs) {
        let libPath
        let contents = []
        try {
          console.log(`Loading ${view.path}`)
          view.package ? libPath = path.join(this.root, '../', '/node_modules', view.package, '/lib/', view.path) : libPath = path.join(this.root, view.path)
          contents = fs.readdirSync(libPath)

        } catch (e) {
          console.log(`${view.path} does not exist.`, e)
        }
        for (let content of contents) {
          // this is where lib vs local path is resolved
          // actual path as dir param, view path + content as name
          this.loadView(libPath + content, view.path + content)
        }
      }
    }

  // sends each type of asset to its according compilation method and loads it into memory
  loadView(dir, name) {
    let loaderOutputString = ''
    let stat = fs.statSync(dir)
    if (!stat.isDirectory()) {
      return
    }

    if (this.loadViewControllers(path.resolve(dir), name)) {
      loaderOutputString += ' [VC]'
    }

    if (this.loadTemplates(path.resolve(dir), name, this.templateDir)) {
      loaderOutputString += ' [T]'
    }

    if (this.loadStyles(path.resolve(dir), name)) {
      loaderOutputString += ' [ST]'
    }

    if (this.loadScripts(path.resolve(dir), name)) {
      loaderOutputString += ' [SC]'
    }

    console.log(`Loaded View (${dir})${loaderOutputString}`)
    loaderOutputString = ''

  }

  // require javasript file view controllers and loads them into view array
  loadViewControllers(dir, name) {
    try {
      let vcPath = path.join(dir, this.vc)
      let stat = fs.statSync(vcPath)
      if (stat.isFile()) {
        let controller = require(path.join(dir, this.vc))
        this.views[name] = controller
        return true
      }
    } catch (e) {
      console.log('Error: No view controller found for in', dir)
    }

    return false
  }

  loadScripts(dir, name) {
    let files
    let basePath = path.join(dir, this.scriptsDir)
    try {
      files = fs.readdirSync(basePath)
    } catch (e) {
      return false
    }
    // TODO: Needs refactoring evenutually to support devo vs prod.
    if (files) {
      for (let file of files) {
        // TODO hook up
        try{
          assetProcessor.processScripts(basePath, name, file)
        }
        catch(err){
          console.log(file,err)
        }
      }
      return true
    }
  }

  // reusable with different processStylesMethod which is currently stylus dependent
  loadStyles(dir, name) {
    let files
    let basePath = path.join(dir, this.stylesDir)

    try {
      files = fs.readdirSync(basePath)
    } catch (e) {
      return false
    }

    if (files) {
      for (let fileInput of files) {
        // Get input and output filenames
        let fileOutput = `${fileInput.slice(0, fileInput.lastIndexOf('.'))}.css`

        // Process the stylesheet
        assetProcessor.processStyles(basePath, name, fileInput, fileOutput)
      }
      return true
    }
  }


  // load templates from dirs, this method is reusable with different compile methods
  loadTemplates(dir, name, templateDir) {
    // Load in and compile the templates in the view's dir using dust.
    let files
    try {
      files = fs.readdirSync(path.join(dir, templateDir))
    } catch (e) {
      return false
    }
    if (files) {
      for (
        let file of files) {
        let content = util.file.readIfFile(path.join(dir, templateDir, file))
        let templateName = path.join(name, file)
        viewEngine.compileMethod(content, templateName)
      }
      return true
    } else {
      console.log('No Partials Found')
    }
  }

  getView(path) {
    if (path in this.views) {
      return this.views[path]
    } else {
      throw new Error(`Unable to find view at path: ${path}`)
    }

  }

  // render a template with the viewEngine
  async renderTemplate(name, data) {
    return viewEngine.renderMethod(name, data, this.templateVars)
  }
}

module.exports = ViewLoader
