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
  function resolved() {
    resolve()

    resume()
  }

  function rejected() {
    reject()
    console.log('reject:', url)
    resume()
  }

  requestNum += 1
  request.get(url).on('error', reject)
    .pipe(fs.createWriteStream(dest))
    .on('finish', resolved)
    .on('end', resolved)
    .on('close', resolved)
    .on('error', rejected)
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
