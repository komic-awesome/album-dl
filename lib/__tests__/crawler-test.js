'use strict'

jest.autoMockOff()
jest.mock('request')
  .mock('../download')
  .mock('fs')

var Crawler = require('../crawler')
  , _ = require('lodash')

describe('async tests', () => {
  var crawler

  beforeEach(function() {
    crawler = new Crawler({
      home: 'https://www.douban.com/photos/album/51346564/'
    , workshop: process.cwd()
    })
  })

  pit('extract image url', () => {
    return crawler.extractImageFromProfile(
      'https://www.douban.com/photos/photo/2266307162/')
      .then(image => expect(image).toEqual(
        'https://img1.doubanio.com/view/photo/large/public/p2191808278.jpg'))
  })

  pit('extract album page\'s url', () => {
    return crawler.extractAlbumUrls()
      .then((albumUrls) => {
        expect(albumUrls.length).toEqual(3)
        expect(albumUrls[0].start).toEqual(0)
        expect(albumUrls[2].start).toEqual(36)

        expect(albumUrls[2].url)
          .toEqual('https://www.douban.com/photos/album/26875784/?start=36')
      })
  })

  pit('extract image profile\'s url', () => {
    return crawler.extractProfileFromAlbum(
      { url: 'https://www.douban.com/photos/album/51346564/'
      , start: 0
      })
  })
});
