'use strict'

const minimist = require('minimist')
const Crawler = require('../lib/crawler')

var argv = minimist(process.argv.slice(2))
  , albumUrl = argv._[0]
  , cralwer = new Crawler({
      home: albumUrl
    , workshop: process.cwd()
    })

cralwer.run()
