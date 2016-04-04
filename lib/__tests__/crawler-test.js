'use strict'

jest.autoMockOff()
jest.mock('request')

var Crawler = require('../crawler')

describe('async tests', () => {
  var cralwer

  beforeEach(function() {
    cralwer = new Crawler('https://www.douban.com/photos/album/51346564/')
  })


  pit('extract image url', () => {
    return cralwer.extractImageFromProfile(
      'https://www.douban.com/photos/photo/2266307162/')
      .then(image => expect(image).toEqual(
        'https://img3.doubanio.com/view/photo/photo/public/p529152911.jpg'))
  })

  pit('extract album page\'s url', () => {
    return cralwer.extractAlbumUrls()
      .then(urls => expect(urls.length).toEqual(3))
  })

  pit('extract image profile\'s url', () => {
    return cralwer.extractProfileFromAlbum(
      'https://www.douban.com/photos/album/51346564/')
  })
});
