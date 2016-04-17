'use strict'

const minimist = require('minimist')
const Crawler = require('../lib/crawler')
const ProgressBar = require('progress');

var argv = minimist(process.argv.slice(2))
  , albumUrl = argv._[0]
  , crawler = new Crawler({
      home: albumUrl
    , workshop: process.cwd()
    })

const PROGRESS_TOTAL = 100

var bar = new ProgressBar('Downloading [:bar] :percent', {
    complete: '='
  , incomplete: ' '
  , width: 20
  , total: PROGRESS_TOTAL
})

crawler.on('progress', (percent) => {
  bar.update(percent)
})

crawler.run()
