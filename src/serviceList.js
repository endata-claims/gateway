module.exports = [
  { name: 'old_gateway', uri: 'http://old-api-sit.endataclaims.com/midgard/graphql' },
  { name: 'form_service', uri: 'http://form:4002/' },
  { name: 'video_service', uri: 'http://video:4000', subUri: 'ws://video:4000/midgard/video' },
]
