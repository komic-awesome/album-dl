'use strict'

const request = require('request')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')

var pendingURLs = []
var requestNum = 0

function resume() {
  requestNum -= 1
  requestNum = requestNum < 0 ? 0 : requestNum

  if (pendingURLs.length) {
    var item = pendingURLs.shift()

    download(item.url, item.dest, item.urlResolved, item.urlRejected)
  }
}

function download(url, dest, resolve, reject) {
  function failDownload() {
    reject('Fail to download ' + url + 'from net.')

    resume()
  }

  function failWrite() {
    reject('Fail to write ' + url +' to disk.')

    resume()
  }

  requestNum += 1
  // end vs finish: http://stackoverflow.com/a/34310963/1196640
  request.get(url).on('error', failDownload)
    .on('end', resume)
    .pipe(fs.createWriteStream(dest))
    .on('error', failWrite)
    .on('finish', resolve)
}

module.exports = function(url, dest) {
  return new Promise((resolve, reject) => {
    if (requestNum < 5) {
      download(url, dest, resolve, reject)
    } else {
      pendingURLs.push({'url': url
                      , 'dest': dest
                      , 'urlResolved': resolve
                      , 'urlRejected': reject})
    }
  })
}
