const AWS = require('aws-sdk')
const {
  COMPANION_AWS_KEY,
  COMPANION_AWS_SECRET,
} = require('../configs')

const uploadToS3 = async (bucket, file) => {
  const s3 = new AWS.S3({
    accessKeyId: COMPANION_AWS_KEY,
    secretAccessKey: COMPANION_AWS_SECRET,
  })
  const params = {
    Bucket: bucket,
    Key: file.name,
    Body: file.stream,
  }
  const res = await s3.upload(params).promise()
    .catch(err => {
      if (err) console.log(err)
      return null
    })
  const s3File = {
    name: res.key,
    url: res.Location,
  }

  return s3File
}

module.exports = uploadToS3