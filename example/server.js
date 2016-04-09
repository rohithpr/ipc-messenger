(function() {
  var cluster = require('cluster')
  var http = require('http')
  var ipcm = require('ipc-messenger')

  var numCPUs = require('os').cpus().length

  var masterReceiver = function(message) {
    console.log('masterReceiver:', message)
  }

  var workerReceiver = function(message) {
    console.log('workerReceiver:', message)
  }

  var handler = function(request, response) {
    ipcm.messageMaster('message master')
    ipcm.messageSiblings('message siblings')
    ipcm.messageWorkers('message workers')
    response.writeHead(200)
    response.end('Done')
    return
  }

  if (cluster.isMaster) {
    var worker
    for (var i = 0; i < numCPUs; i++) {
      worker = cluster.fork()
      ipcm.register(worker, masterReceiver)
    }
  }
  else {
    ipcm.register(process, workerReceiver)
    http.createServer(handler).listen(8000)
  }
})()
