'use strict'

const minimist = require('minimist')

var argv = minimist(process.argv.slice(2))
  , albumUrl = argv._

console.log(albumUrl)
