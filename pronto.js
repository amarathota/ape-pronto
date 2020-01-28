/**
                              __
     ____  _________  ____  / /_____
    / __ \/ ___/ __ \/ __ \/ __/ __ \
   / /_/ / /  / /_/ / / / / /_/ /_/ /
  / .___/_/   \____/_/ /_/\__/\____/
 /_/ V0.1 (c) Time Inc.

Speed optimized rendering engine for widget based pages.
The fastest gun in the west, and the new hotness.

There are four basic stages of pronto rendering.

    Routing: Determine the page to render based on the request
    Composing: Determine the template and widgets that need rendered.
    Rendering: Merge views, templates and view models to render the output
    Dispatching: Send the bits to the target

These stages are split up and componentized to allow for easy study and modification.

The meanest of these stages is the Rendering stage which also includes fetching data etc.
**/
import config from 'config'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import Composer from './composer.js'
import Renderer from './renderer.js'
import ServiceRequest from './service-request.js'
import ViewLoader from './viewloader.js'
import Util from './util/index'
let util = new Util()
import packageFile from './package.json'
let verCopy = chalk.red(`${packageFile.version} (c) Time Inc.`)

let instance
class Pronto {
  contentFor404 = ''
  errorPageConfig = {}

  constructor() {
    // Turn pronto into a singleton
    if (!instance) {
      instance = this
      this.init()
      this.serviceRequest = new ServiceRequest()
      this.viewLoader = new ViewLoader()
      this.renderer = new Renderer()
      this.composer = new Composer()
    }
    return instance
  }

  /**
   * Initializes the pronto application.
   */
  init() {
    console.log(chalk.yellow(String.raw`
          ,)))))))),,,
        ,(((((((((((((((,
        )\`\)))))))))))))),
  *--===///\_   '''(((((((((
       \\\ b\  \    '')))))))
        ))\    |      ((((((((
       (   \   |\.    ))))))))
            \, /  )  ((((((((
              "  /    )))))))
                /    ((((
               |      ))`
         ))
    console.log(String.raw `
              ${chalk.green('Initializing')}    ${chalk.green('__')}
      ${chalk.green('____  _________  ____  / /_____')}
     ${chalk.blue('/ __ \\/ ___/ __ \\/ __ \\/ __/ __ \\')}
    ${chalk.blue('/ /_/ / /  / /_/ / / / / /_/ /_/ /')}
   ${chalk.magenta('/ .___/_/   \\____/_/ /_/\\__/\\____/')}
  ${chalk.magenta('/_/')}
                    ${verCopy}
      `)
    // Read and store the 404 page, which is the only static page Pronto should know about
    let pathTo404 = path.join(config.get('pronto.static_base_path'), config.get('pronto.static_404_path'))
    this.contentFor404 = fs.readFileSync(pathTo404, {
      encoding: "utf-8"
    })
  }

  /**
   * Sets up error page configuration for dynamic error pages.
   *
   * @param config: a map of server status codes (like 404, 403, 500) to
   *      prontoConfig objects (see below in respond definition). These are used when
   *      attempting to render errors in pronto.
   */
  setErrorPageConfig(config) {
    this.errorPageConfig = config
  }

  /**
   * Add a composition to the response.
   * This allows view_controllers to mutate the layoutContent with an
   * additional composition. It's a bit kludgey right now but I can't
   * think of a better way of doing this just yet.
   */
  async addToResponse(req, res, composition) {
    await this.renderer.renderSubWidgets(req, res, composition)
  }

  /**
   * Respond to a request using pronto. This should be called any time we need
   * to render something with the engine.
   * @param req: The request object
   * @param res: The response object
   * @param prontoConfig: A pronto config object (see signature for renderPage function)
   */
  async respond(req, res, prontoConfig) {
    let statusCode = 200
    let responseBody = ''

    // Compose and render the page
    try {
      responseBody = await this.renderPage(req, prontoConfig)
    } catch (e) {
      statusCode = 404
      console.log('Unable to get rendered page. Rendering 404', e)

      try {
        // Attempt to render a dynamic 404 page
        responseBody = await this.renderPage(req, this.errorPageConfig[statusCode])
      } catch (e) {
        console.log('Using static 404 page.')
        responseBody = this.contentFor404
      }
    }

    // Send the page to the user
    res.status(statusCode)
    res.removeHeader('Server')
    res.removeHeader('X-Powered-By')
    res.send(responseBody)
  }


  /**
   * Render a page body with Pronto.
   * @param req: The request object
   * @param prontoConfig: Object to configure this portion of the Pronto rendering:
   *      {
   *          service: "[Service name, as string, e.g. 'composition_service']",
   *          version: "[Version of service to call, as version string, e.g. '1.0']",
   *          type: "[Type of page to render, e.g. 'page', 'article']"
   *      }
   */
  async renderPage(req, prontoConfig) {

    let prontoResponse = {}
    await this.composer.compose(req, prontoResponse, prontoConfig)
    await this.renderer.render(req, prontoResponse)
    return prontoResponse.body
  }
}

module.exports = Pronto
