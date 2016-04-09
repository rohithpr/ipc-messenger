(function(module) {
  var cluster = require('cluster')
  var process = require('process')

  // This function will be called on receiving a message
  // Can be overwritten when `register` is called
  var CALLBACK = function(message) {}

  // This function can be used by workers to send a message to the master
  var messageMaster = function(message) {
    var pack = {
      toMaster: true,
      toWorkers: false,
      toSource: false,
      message: message,
      source: process.pid
    }
    dispatch(pack)
  }

  // This function can be used to send a message to all workers
  var messageWorkers = function(message) {
    var pack = {
      toMaster: false,
      toWorkers: true,
      toSource: true,
      message: message,
      source: process.pid
    }
    dispatch(pack)
  }

  // This function can be used to send a message to all the siblings of a worker
  // Differs with `messageWorkers` as the sender's callback will not be called
  var messageSiblings = function(message) {
    var pack = {
      toMaster: false,
      toWorkers: true,
      toSource: false,
      message: message,
      source: process.pid
    }
    dispatch(pack)
  }

  // Message receiver of the master
  var masterHandler = function(pack) {
    if (pack.toMaster === true) {
      CALLBACK(pack.message)
    }
    dispatch(pack)
  }

  // Message receiver of the workers
  var workerHandler = function(pack) {
    if (pack.toSource !== false || pack.source !== process.pid) {
      CALLBACK(pack.message)
    }
  }

  // Common function called to send messages to other processes
  var dispatch = function(pack) {
    if (cluster.isMaster) {
      if (pack.toWorkers === true) {
        for (var key in cluster.workers) {
          cluster.workers[key].send(pack)
        }
      }
    }
    else {
      if (pack.toMaster === true || pack.toWorkers === true) {
        process.send(pack)
      }
    }
  }

  // Used to register processes and custom callback functions
  var register = function(process, callback) {
    if (callback !== undefined && typeof callback === 'function') {
      CALLBACK = callback
    }
    if (cluster.isMaster) {
      process.on('message', masterHandler)
    }
    else {
      process.on('message', workerHandler)
    }
  }

  module.exports.register = register
  module.exports.dispatch = dispatch
  module.exports.messageMaster = messageMaster
  module.exports.messageWorkers = messageWorkers
  module.exports.messageSiblings = messageSiblings
})(module)
