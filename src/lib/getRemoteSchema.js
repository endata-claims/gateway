const { HttpLink } = require('apollo-link-http')
const { split } = require('apollo-client-preset')
const { getMainDefinition } = require('apollo-utilities')

const ws = require('ws')
const { SubscriptionClient } = require('subscriptions-transport-ws')

const fetch = require('node-fetch')
const { introspectSchema, makeRemoteExecutableSchema } = require('graphql-tools')
const { setContext } = require('apollo-link-context')

const getServiceAuth = require('./getServiceAuth')

module.exports = async ({ name, uri, subUri }) => {
  const introspectLink = new HttpLink({ uri, fetch })
  const schema = await introspectSchema(introspectLink)

  const httpLink = setContext(async (_, previousContext) => {
    const authorization = previousContext.graphqlContext
      ? await getServiceAuth(name, previousContext.graphqlContext.req.headers.authorization)
      : null

    return { headers: { authorization }}
  }).concat(new HttpLink({ uri, fetch }))

  const wsLink = subUri ? new SubscriptionClient(subUri, { reconnect: true }, ws) : null
  const link = subUri
    ? split(
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query)
        return kind === 'OperationDefinition' && operation === 'subscription'
      },
      wsLink,
      httpLink
    )
    : httpLink

  const executableSchema = makeRemoteExecutableSchema({ schema, link })
  return executableSchema
}
