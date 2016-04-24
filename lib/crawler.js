'use strict'

const _ = require('lodash')
const request = require('request')
const cheerio = require('cheerio')
const path = require('path')
const download = require('./download')
const EventEmitter = require('events')
const util = require('util')
const sanitize = require('sanitize-filename')
const fs = require('fs')

const EVERYPAGE_IMAGE_COUNT = 18

var Crawler = function(options) {
  EventEmitter.call(this)
  this.home = options.home
  this.workshop = options.workshop
  this.downloadProgress = 0
}

util.inherits(Crawler, EventEmitter)

// See more http://stackoverflow.com/a/29396005

function promiseWhile(predicate, action, value) {
  return Promise.resolve(value).then(predicate).then(function(condition) {
    if (condition) {
      return promiseWhile(predicate, action, action())
    }
  })
}

const HTTP_STATUS_SUCCESS = 200

Crawler.prototype.request = function(url, callback, handleError) {
   handleError = handleError
     || function(error) { throw new Error(error || '发生了奇怪的错误') }

   return request({
     url: url
   , headers: {
      'User-Agent': 'request'
     }
   }, function(error, resp, body) {
     if (error) { return handleError(error) }
     if (resp.statusCode !== HTTP_STATUS_SUCCESS) {
       return handleError(
         [ 'HTTP statusCode: ' + resp.statusCode
         , 'URL: ' + url
         ].join(', ')
       )
     }
     return callback(body)
   })
}

Crawler.prototype.addProgressWhenDownloaded = function(percentInPage) {
  if (!this.albumPagesCount) { return }
  var singlePagePercent = 1 / this.albumPagesCount
  this.downloadProgress += singlePagePercent * percentInPage

  this.emit('progress', this.downloadProgress.toFixed(2))
}

function directoryExists(filePath) {
  // See more: http://tinyurl.com/3zu9tam
  try {
    return fs.statSync(filePath).isDirectory();
  }
  catch (err) {
    return false;
  }
}

Crawler.prototype.createWorkshop = function(albumName) {
  this.workshopHasCreated = true

  albumName = sanitize(albumName)

  var pathDuplcateIndex = 0
    , albumPath = ''

  do {
    albumPath = path.join(this.workshop
      , albumName + (pathDuplcateIndex ? '-' + pathDuplcateIndex : ''))
    pathDuplcateIndex += 1
  } while(directoryExists(albumPath))

  fs.mkdirSync(albumPath)
  this.workshop = albumPath
}

Crawler.prototype.extractAlbumUrls = function() {
  var imageCountStart = 0

  return new Promise((resolve, reject) => {
    let nextLink = this.home
      , albumUrls = []

    promiseWhile(() => {
      return !!nextLink
    }, () => {
      return new Promise((resolve, reject) => {
        if (nextLink) {
          albumUrls.push({ url: nextLink , start: imageCountStart })
          imageCountStart += EVERYPAGE_IMAGE_COUNT
        }

        this.request(nextLink, (body) => {
          let $ = cheerio.load(body)

          if (!this.workshopHasCreated) {
            this.createWorkshop($('#db-usr-profile .info h1').text())
          }

          nextLink = $('link[rel="next"]')
          nextLink = nextLink.length ? nextLink.attr('href') : ''

          resolve()
        }, reject)
      })
    }, !!nextLink).then(function() {
      resolve(albumUrls)
    }, reject)
  })
}

Crawler.prototype.extractImageFromProfile = function(profileUrl) {
  return new Promise((resolve, reject) => {
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
        }, reject)
      }
    }, reject)
  })
}

Crawler.prototype.extractProfileFromAlbum = function(page) {
  return new Promise((resolve, reject) => {
    this.request(page.url, (body) => {
      let $ = cheerio.load(body)
        , links = $('.photolst_photo')
        , imageCountStart = page.start

      Promise.all(
        links.map((index, link) => {
          let href = $(link).attr('href')
          return this.extractImageFromProfile(href)
            .then((imageUrl) => {
              return download(
                imageUrl, path.join(
                    this.workshop
                  , [ imageCountStart + index, 'jpeg' ].join('.')
                )
              )
            })
            .then(() => {
              this.addProgressWhenDownloaded(1 / links.length)
            })
        }).get()
      ).then(resolve, reject)
    }, reject)
  })
}

Crawler.prototype.run = function() {
  return new Promise((resolve, reject) => {
    this.extractAlbumUrls().then((albumPages) => {
      this.albumPagesCount = albumPages.length
      Promise.all(
        albumPages.map((page) => {
          return this.extractProfileFromAlbum(page)
        })
      ).then(resolve, reject)
    }, reject)
  })
}

module.exports = Crawler
