const { ApolloClient } = require('apollo-client')
const { InMemoryCache } = require('apollo-cache-inmemory')
const { createUploadLink } = require('apollo-upload-client')
const fetch = require('node-fetch')
const FormData = require('form-data')

module.exports = url => new ApolloClient({
  link: createUploadLink({
    uri: url,
    serverFormData: FormData,
    fetch
  }),
  cache: new InMemoryCache()
})