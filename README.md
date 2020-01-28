# The Application Rendering Process


## Goals

* Component/Widget based rendering of the page such that the widgets can be re-used across surfaces and applications.
* Extensible and event based
* Simple and library agnostic - the depenency on express, moustache etc is abstracted through and interface.
* 








    Setup
    a. Trigger the before pre-render event
    b. Contruct the request object with all the params we have and all of the device detection, user det etc.
    c. Trigger the after pre-render event

    Router
    :before-routes
    1. Get the route/path mapping using the request object and calling the routes object.
    2. Decorate the request object
    :after-routes

    /    ->    /home-page


    Composer
    :before-composition        
    2. Call the page composition service
        - This returns a json representation of the page and it's components based on the request object
        - The components are refrences to the content services (DAMs) and can be recursively defined
    :after-composition

    composition-service/home-page -> {
        template: "time/home-page-default",
        application: "DefaultProntoApplication" // Optional uses the default application if not supplied.
        configuration: {},
        components: {
            "#top":{
                type: "widgets/latest-news",
                configuration: {
                    view: "standard"
                    src: {
                        service: "dam-api",
                        parameters: {
                            "trending-news": "true",
                            "foo": "bar"
                        }
                    },
                    enable-foo: "true"
                }
            },
            "#right":{
                type: "widgets/trending-news",
                configuration: {
                    view: "time/custom-trending"
                    src: {
                        service: "dam-api",
                        parameters: {
                            "trending-news": "true",
                            "foo": "bar"
                        }
                    }
                } 
            }
        }
    }

    Renderer (Takes in a response object and the response from the composition service).
    :before-render
        1. Compose the response object from the config etc.
        2. Itterate through the components and use the component renderer to add the output to the component array/object

            a. The component renderer handles service caching etc.
            b. The component renderer handles html caching too.

        /templates
            home/
                views/
                styles/
                scripts/
                template.js
                Readme.md
        /widgets
            top-stories/
                widget.js
                /views/
                    default.thtml
                    mobile.thtml
                    ios.thtml
                /styles/
                    top-stories.css
                /scripts/
                    top-stories.js
                options.json
                Readme.md
            /global-nav/
            ...etc...

            top: [widget1, widget2, widget 3].

        3. Pull in and compile the master template

        widget rendering -- mustache-renderer (provides an interface to moustache.js)


    :after-render
## Pronto process and request lifecycle

1. node index
2. pronto init
     - pronto viewloader.init
           - read config
           - load vews then partials into views object
               - load view controllers
               - load and compile templates
               - load and compile styles
               - load and compile scripts
3. Express route hit
4. Set pronto composition config and type
5. Pronto respond
     - pronto composer
          - make service request to compositions service for the entity type
     - pronto renderer
          - render widgets
               - loops through components in composition and calls renderView
               - renderView gets the view controller from memory and runs its
                    - view_controller render method calls either prontoAddToResponse in the case of a composite widget or viewLoader.renderTemplate in the case of a final widget
          - render layout
     - send express respond

## Widget Loader

ProntoWidgets

Need to pull these into memory to make rendering quick.

    1. Drop into the widgets directory, 

## Developement 



## Production

All 



