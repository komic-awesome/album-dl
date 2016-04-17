'use strict'

const _ = require('lodash')
const request = require('request')
const cheerio = require('cheerio')
const path = require('path')
const download = require('./download')

const EVERPAGE_IMAGE_COUNT = 18

var Cralwer = function(options) {
  this.home = options.home
  this.workshop = options.workshop
}

// See more http://stackoverflow.com/a/29396005

function promiseWhile(predicate, action, value) {
  return Promise.resolve(value).then(predicate).then(function(condition) {
    if (condition) {
      return promiseWhile(predicate, action, action())
    }
  })
}

Cralwer.prototype.request = function(url, callback) {
   return request({
     url: url
   , headers: {
      'User-Agent': 'request'
     }
   }, function(error, resp, body) {
     // TODO: hanlde request error
     callback(body)
   })
}

Cralwer.prototype.extractAlbumUrls = function() {
  var imageCountStart = 0

  return new Promise((resolve) => {
    let nextLink = this.home
      , albumUrls = []

    promiseWhile(() => {
      return !!nextLink
    }, () => {
      return new Promise((resolve, reject) => {
        if (nextLink) {
          albumUrls.push({ url: nextLink , start: imageCountStart })
          imageCountStart += EVERPAGE_IMAGE_COUNT
        }

        this.request(nextLink, (body) => {
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
    this.request(profileUrl, (body) => {
      let $ = cheerio.load(body)
        , thumbImage = $('.image-show-inner img')
        , linkToLarge = $('a[title="查看原图"]')
      if (!linkToLarge.length) {
        resolve(thumbImage.attr('src'))
      } else {
        this.request(linkToLarge.attr('href'), (body) => {
          let $ = cheerio.load(body)
          resolve($('#pic-viewer img').attr('src'))
        })
      }
    })
  })
}

Cralwer.prototype.extractProfileFromAlbum = function(page) {
  return new Promise((resolve, reject) => {
    this.request(page.url, (body) => {
      let $ = cheerio.load(body)
        , links = $('.photolst_photo')
        , imageCountStart = page.start

      Promise.race(
        links.map((index, link) => {
          var href = $(link).attr('href')
          return this.extractImageFromProfile(href)
            .then((imageUrl) => {
              return download(
                imageUrl, path.join(
                    this.workshop
                  , [ imageCountStart + index, 'jpeg' ].join('.')
                )
              )
            })
        }).get()
      ).then(resolve, reject)
    })
  })
}

Cralwer.prototype.run = function() {
  return new Promise((resolve, reject) => {
    this.extractAlbumUrls().then((albumPages) => {
      Promise.race(
        albumPages.map((page) => {
          return this.extractProfileFromAlbum(page)
        })
      ).then(resolve, reject)
    })
  })
}

module.exports = Cralwer
