const { ApolloServer } = require('apollo-server-express')
const express = require('express')
const http = require('http')

const { FormatErrorWithContextExtension } = require('graphql-format-error-context-extension')

const cors = require('cors')
const bodyParser = require('body-parser')
const session = require('express-session')
const companion = require('@uppy/companion')
const uuid = require('uuid/v4')

const services = require('./serviceList')
const getSchema = require('./schema')

const {
  SERVICE_PORT,
  SERVICE_PATH,
  COMPANION_SECRET,
  COMPANION_DOMAIN,
  COMPANION_DATADIR,
  COMPANION_AWS_KEY,
  COMPANION_AWS_SECRET,
  COMPANION_AWS_BUCKET,
  COMPANION_AWS_REGION,
  COMPANION_AWS_USE_ACCELERATE_ENDPOINT,
  CORS_ORIGIN,
} = require('./configs')

;(async () => {
  const schema = await getSchema(services)

  const server = new ApolloServer({
    schema,
    context: ({ req, res, connection }) => ({ req, res, connection }),
    subscriptions: SERVICE_PATH,
    playground: {
      endpoint: SERVICE_PATH,
      subscriptionEndpoint: SERVICE_PATH,
    },
    introspection: true,
    extensions: [
      () => new FormatErrorWithContextExtension((err, ctx) => {
        if (err && err.extensions && err.extensions.code === 'authorization') {
          ctx.res.statusCode = 401
        }

        return err
      })
    ]
  })

  const app = express()

  app.use(cors({
    origin: CORS_ORIGIN,
    // methods: CORS_METHODS,
    preflightContinue: false,
    optionsSuccessStatus: 204
  }))

  app.use(bodyParser.json())

  app.use(session({
    secret: COMPANION_SECRET,
    resave: true,
    saveUninitialized: true
  }))

  app.use(companion.app({
    providerOptions: {
      s3: {
        getKey: (_, filename) => `${uuid()}__PREFIX__${filename}`,
        key: COMPANION_AWS_KEY,
        secret: COMPANION_AWS_SECRET,
        bucket: COMPANION_AWS_BUCKET,
        region: COMPANION_AWS_REGION,
        useAccelerateEndpoint: COMPANION_AWS_USE_ACCELERATE_ENDPOINT | false,
      }
    },
    server: {
      host: COMPANION_DOMAIN
    },
    filePath: COMPANION_DATADIR
  }))

  server.applyMiddleware({
    app,
    path: SERVICE_PATH,
    // cors: {
    //   credentials: true,
    //   origin: FRONT_END_ORIGIN,
    //   allowedHeaders: 'Authorization,Accept,Origin,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range',
    // },
    bodyParserConfig: { limit: '40mb', type: 'application/json' },
  })

  const httpServer = http.createServer(app)
  server.installSubscriptionHandlers(httpServer)

  httpServer.listen(SERVICE_PORT, () => {
    console.log(`GraphQL API endpoint: http://localhost:${SERVICE_PORT}${server.graphqlPath}`)
    console.log(`GraphQL Subscription endpoint: ws://localhost:${SERVICE_PORT}${server.subscriptionsPath}`)
    console.log(`Companion endpoint: http://localhost:${SERVICE_PORT}`)
  })
})()

require('./lib/gracefulShutdown')