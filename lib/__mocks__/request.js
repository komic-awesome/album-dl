'use strict'

const fs = require('fs')
const path = require('path')
const urlUtils = require('m9js/lib/url')
const _ = require('lodash')

function loadPageHtml(pageName) {
  return fs.readFileSync(
    path.join(__dirname, '../__fixtures__/' + pageName + '.html')
  ).toString()
}

var pageRouteMap = new Map()

pageRouteMap.set(/www\.douban\.com\/photos\/album\/\d+\//i, function(url) {
  var start = urlUtils.getURLParameter('start', url)
  if (!start) {
    return loadPageHtml('album-home')
  } else if (start === '18') {
    return loadPageHtml('album-content')
  } else if (start === '36') {
    return loadPageHtml('album-end')
  }
})

pageRouteMap.set(/photos\/photo\/\d+\/large/i, function(url) {
  return loadPageHtml('album-large-photo')
})

pageRouteMap.set(/photos\/photo\/\d+/i, function(url) {
  return loadPageHtml('album-profile')
})

module.exports = function (options, callback) {
  var error = null
    , resp = null
    , body = ''
    , url = options.url

  var KEY = 0
    , VALUE = 1

  for (var item of pageRouteMap.entries()) {
     var route = item[KEY]
       , page = item[VALUE]

     if (!route.test(url)) { continue }
     body = _.isFunction(page) ? page(url) : page
     break
  }

  callback(error, resp, body)
}
