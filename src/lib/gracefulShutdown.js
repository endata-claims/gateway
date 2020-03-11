const signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15,
}

Object.keys(signals).forEach(signal => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`)
    console.log(`exitting...`)
    process.exit(signals[signal])
  })
})