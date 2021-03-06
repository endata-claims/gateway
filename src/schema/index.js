// const { mergeSchemas } = require('graphql-tools-fork')
const { mergeSchemas } = require('graphql-tools')
const getRemoteSchema = require('../lib/getRemoteSchema')
const { gql } = require('apollo-server-express')

const { VIDEO_SERVICE_BUCKET } = require('../configs')
const uploadToS3 = require('../lib/uploadToS3')

const getForwardClient = require('../lib/getForwardClient')

const linkTypeDefs = gql`
  scalar Json

  extend type ClaimJob {
    reportForm: Form
    reportData: Report
  }
`
const createResolvers = schemas => {
  return {
    Mutation: {
      photoUpload: async (parent, args, context, info) => {
        const file = await args.file.then(file => ({
          name: file.filename,
          stream: file.createReadStream()
        }))
        const s3File = await uploadToS3(VIDEO_SERVICE_BUCKET, file)

        const client = getForwardClient(schemas.video_service.url)

        const forward = await client.mutate({
          mutation: gql(context.req.body.query),
          variables: {
            ...args,
            file: s3File
          }
        })
        console.log(forward)

        return forward.data.photoUpload
      }
    },
    ClaimJob: {
      reportForm: {
        fragment: '... on ClaimJob { reportFormId }',
        resolve: (claim, __, context, info) => {
          if (!claim.reportFormId) return null

          return info.mergeInfo.delegateToSchema({
            schema: schemas.form_service.schema,
            operation: 'query',
            fieldName: '_form',
            args: { id: claim.reportFormId },
            context,
            info
          })
        }
      },
      reportData: {
        fragment: '... on ClaimJob { id }',
        resolve: async (claim, __, context, info) => {
          const report = await info.mergeInfo.delegateToSchema({
            schema: schemas.form_service.schema,
            operation: 'query',
            fieldName: '_report',
            args: { claimId: claim.id },
            context,
            info
          })

          return report
        }
      }
    }
  }
}

module.exports = async services => {
  const schemas = await getSchemas(services)
  const schema = mergeSchemas({
    schemas: [
      ...Object.values(schemas).map(({ schema }) => schema),
      linkTypeDefs
    ],
    mergeDirectives: true,
    resolvers: createResolvers(schemas)
  })

  return schema
}

const getSchemas = async services => {
  const schemaPromises = await Promise.all(services.map(async service => ({
    name: service.name,
    schema: await getRemoteSchema(service),
    url: service.uri
  })))
  const schemas = schemaPromises.reduce((total, current) => {
    total[current.name] = {
      schema: current.schema,
      url: current.url
    }
    return total
  }, {})

  return schemas
}