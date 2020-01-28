/**
    Cacheable service request object used throughout the app.

    Handles fatal and warning requests, logs time for service to respond etc.

    Standardizes the way the client communicates with the service.

    TODO: Better logging
    TODO: Retry Logic Built In
    TODO: Caching etc.
**/

import config from 'config'
import path from 'path'
import request from 'request-promise'
import url from 'url'
import Util from './util/index'
let util = new Util()

let instance
class ServiceRequest {

  cache = {}
  defaultCacheTtl = config.get('pronto.default_cache_ttl')

  constructor() {
    if (!instance) {
      instance = this
    }

    return instance
  }

  request(serviceName, version, uri, query) {
    let req = config.get(`services.${serviceName}`) || {}

    if (version) {
      req.pathname = path.join(req.base_path, version)
    } else {
      req.pathname = req.base_path
    }

    req.pathname = path.join(req.pathname, uri)

    if (req.format) {
      req.pathname += `.${req.format}`
    }
    req.query = query

    return this.getServiceResult(req)
  }

  /**
   * Make a service request and return the result.
   * @param req: Object, to be passed to the url library
   * @returns JSON: body of response from request
   */

  async getServiceResult(req) {
    // Contains Naive caching of service requests...needs refactoring.
    let u = url.format(req)
    let key = req.method + ":" + u
    let timeNow = Date.now() / 1000 // Time in seconds
    let ttl = req.ttl >= 0 ? req.ttl : this.defaultCacheTtl
    let responseObject
    let cachedResponse = this.cache[key]
    let serviceResponse

    if (cachedResponse && cachedResponse.fetch_time > timeNow - ttl) {
      serviceResponse = cachedResponse.res
    } else {
      console.log("No cache found for %s", key)

      try {
        // TODO: Add retry logic (https://tools.timeinc.net/jira/browse/MADHYB-60)
        serviceResponse = await request({
          uri: u,
          method: req.method
        })

        // Add the response to the cache...
        this.cache[key] = {
          'fetch_time': timeNow,
          'res': serviceResponse
        }

        console.log('ServiceRequest:', req)
      } catch (e) {
        if(cachedResponse && cachedResponse.res){
          console.log('ServiceRequest failed. Falling back to stale cache.', u)
          serviceResponse = cachedResponse.res
        }else{
          // We had an error fetching the file
          console.log('ServiceRequest failed.', u)
        }
      }
    }

    try {
      responseObject = JSON.parse(serviceResponse)
    } catch (error) {
      console.log('Error parsing JSON', error.message)
    }

    return responseObject
  }

  clearCache() {
    /* Function to bust the cache. Can be called from within a route */
    this.cache = {}
    console.log("ServiceRequest: clearing the cache", this.cache)
  }
}

module.exports = ServiceRequest
