const { mergeSchemas } = require('graphql-tools')
const getRemoteSchema = require('../lib/getRemoteSchema')

const { gql } = require('apollo-server-express')
const linkTypeDefs = gql`
  scalar Json

  extend type ClaimJob {
    reportForm: Form
    reportData: Report
  }
`
const createResolvers = schemas => {
  return {
    ClaimJob: {
      reportForm: {
        fragment: '... on ClaimJob { reportFormId }',
        resolve: (claim, __, context, info) => {
          if (!claim.reportFormId) return null

          return info.mergeInfo.delegateToSchema({
            schema: schemas.form_service,
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
            schema: schemas.form_service,
            operation: 'query',
            fieldName: '_report',
            args: { claimId: claim.id },
            context,
            info
          })
          console.log(report)

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
      ...Object.values(schemas),
      linkTypeDefs
    ],
    mergeDirectives: true,
    resolvers: createResolvers(schemas)
  })

  return schema
}

const getSchemas = async services => {
  const schemaPromises = await Promise.all(services.map(async service => ({ name: service.name, schema: await getRemoteSchema(service) })))
  const schemas = schemaPromises.reduce((total, current) => {
    total[current.name] = current.schema
    return total
  }, {})

  return schemas
}