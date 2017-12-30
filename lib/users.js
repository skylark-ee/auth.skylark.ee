'use strict'

const CFG = require('../config.json')


module.exports = {
  find
}

// Find user data for given user id. Returns undefined if user not found
function find(userId) {
  return CFG.USERS.filter(u => u.id === userId)[0]
}
