const fs = require.requireActual('fs')

fs.mkdirSync = jest.fn()

module.exports = fs
