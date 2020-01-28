import ViewLoader from './viewloader.js'
import Util from './util/index'
let util = new Util()

class Renderer {

  /**
   * main method used by pronto to render a response
   * @param request: Request Object
   * @param response: Response Object
   */

  constructor() {
    this.viewLoader = new ViewLoader()
  }

  async render(request, response) {
    // Reset the map of keys to html/text content.
    response.layoutContent = {}

    // Fill in the map
    await this.renderWidgets(request, response, response.composition.components)

    // Render the layout
    await this.renderLayout(request, response)
  }

  /**
   * Responsible for rendering views, which can be layouts or widgets.
   * @param request: Request Object
   * @param response: Response Object
   * @param view: String, named location of the view, normally a layout or widget
   * @param version: Version String (e.g. "1.0"), used to invoke correct version of view
   * @param required: Boolean, true when the view is required for the page to load
   * @param content: Object to pass to template
   * @returns String: HTML rendered from the view
   */

  async renderView(request, response, view, version, required, content, dataSource) {
    // The view is rendered with a param object, defined below:
    let params = {
      request: request,
      response: response,
      view: view,
      version: version,
      required: required,
      content: content,
      dataSource: dataSource,
      viewLoader: this.viewLoader
    }

    try {
      return await this.viewLoader.getView(view).render(params)
    } catch (e) {
      util.log.error(`Error: Unable to render a view. View: ${view}`, e)

      if (required) {
        throw new Error(`Required widget unable to render: ${view}`)
      }
    }
  }

  /**
   * Render all the widgets, and add them to an object to be passed to the layout.
   * @returns Object: components mapped to their rendered HTML pieces
   */
  async renderWidgets(request, response, componentData) {
    for (let component in componentData) {
      // Set up the widgets as an array, so we can easily render all of them
      let widgets = componentData[component]
      let widgetArray = Array.isArray(widgets) ? widgets : [widgets]

      response.layoutContent[component] = ''

      for (let widget of widgetArray) {
        if (widget) {
          let content = await this.renderView(request, response, widget.view, widget.version, widget.required, widget.content, widget.dataSource)

          if (content) {
            response.layoutContent[component] += content
          }
        }
      }
    }
  }

  /**
   * Renders the layout. This should be called after the layoutContent has been filled out,
   * which is done by rendering all of the widgets for the page.
   */
  async renderLayout(request, response) {
    let composition = response.composition || {}

    // Render the layout with the widgets filled in. This is a string, ready to be parsed by the browser.
    // Add it to the response, to be returned to the user's browser.
    response.body = await this.renderView(request, response, composition.view, composition.version, true, response.layoutContent, composition.remoteData);
  }

  async renderSubWidgets(request, response, components) {
    await this.renderWidgets(request, response, components)
  }
}

module.exports = Renderer
