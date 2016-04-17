'use strict'

const request = require('request')
const _ = require('lodash')
const path = require('path')
const fs = require('fs')

module.exports = function(url, dest) {
  return new Promise((resolve, reject) => {
    request.get(url).on('error', reject)
      .pipe(fs.createWriteStream(dest))
      .on('finish', resolve)
      .on('end', resolve)
      .on('close', resolve)
      .on('error', reject)
  })
}
