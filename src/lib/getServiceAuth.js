const { GraphQLClient } = require('graphql-request')
const { PROFILE_ENDPOINT } = require('../configs')

module.exports = (name, authorization) => {
  const serviceId = getServiceId(name)
  if(!serviceId) return authorization
  console.log({ serviceId, authorization })

  const client = new GraphQLClient(PROFILE_ENDPOINT, {
    headers: { authorization }
  })

  return client.request(
    `mutation userServiceToken($input: ServiceInput!) {
      userServiceToken(input: $input) {
        serviceToken
      }
    }`,
    { input: { serviceId }}
  )
  .then(res => {
    // console.log(res)
    return res
  })
  .then(res => `Bearer ${res.userServiceToken.serviceToken}`)
  // if failed to get the token return null
  .catch(err => null) //console.log(err))
}

const getServiceId = name => {
  switch(name) {
    case 'video_service':
      return 12
    default:
      return null
  }
}
