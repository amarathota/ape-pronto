import ServiceRequest from './service-request.js'
let serviceRequest = new ServiceRequest()

class Composer {
  async compose(request, response, prontoConfig) {
    try  {
      response.composition = await serviceRequest.request(prontoConfig.service, prontoConfig.version, prontoConfig.type)
    } catch (e) {
      console.log('Error retrieving composition from service: ', e)
    }
  }
}

module.exports = Composer
