'use strict'

const _ = require('lodash')
const request = require('request')
const cheerio = require('cheerio')

var Cralwer = function(home) {
  this.home = home
}

// See more http://stackoverflow.com/a/29396005

function promiseWhile(predicate, action, value) {
  return Promise.resolve(value).then(predicate).then(function(condition) {
    if (condition) {
      return promiseWhile(predicate, action, action())
    }
  })
}

Cralwer.prototype.extractAlbumUrls = function() {
  return new Promise((resolve) => {
    let nextLink = this.home
      , albumUrls = []

    promiseWhile(function() {
      return !!nextLink
    }, function() {
      return new Promise((resolve, reject) => {
        if (nextLink) { albumUrls.push(nextLink) }

        request(nextLink, (error, resp, body) => {
          let $ = cheerio.load(body)
          nextLink = $('link[rel="next"]')
          nextLink = nextLink.length ? nextLink.attr('href') : ''

          resolve()
        })
      })
    }, !!nextLink).then(function() {
      resolve(albumUrls)
    })
  })
}

Cralwer.prototype.extractImageFromProfile = function(profileUrl) {
  return new Promise((resolve) => {
    request(profileUrl, (error, resp, body) => {
      let $ = cheerio.load(body)
        , thumbImage = $('.image-show-inner img')
      // TODO(yangqing): 查看原图
      resolve(thumbImage.attr('src'))
    })
  })
}

Cralwer.prototype.extractProfileFromAlbum = function(pageUrl) {
  return new Promise((resolve) => {
    request(pageUrl, (error, resp, body) => {
      let $ = cheerio.load(body)
        , links = $('.photolst_photo')

      Promise.race(
        links.map((index, link) => {
          var href = $(link).attr('href')
          return this.extractImageFromProfile(href)
        }).get()
      ).then(function() {
        resolve()
      })
    })
  })
}

Cralwer.prototype.scrape = function() {
  //TODO(yangqing)
}

module.exports = Cralwer
