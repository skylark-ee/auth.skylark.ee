'use strict'

const path = require('path')
const fs = require('fs-extra')

const ppc = require('ppc-messaging')

const SESSION_PATH = path.join(__dirname, '../data/session/')
fs.ensureDirSync(SESSION_PATH)


module.exports = {
  create, load, save,

  PATH: SESSION_PATH,
}


function create() {
  const sess = ({ k: ppc.randomHex(32) })

  save(sess.k, sess)
  return sess
}

function load(key) {
  const sess = JSON.parse(fs.readFileSync(path.join(SESSION_PATH, key+'.json').toString()))
  return sess
}

function save(key, sessionData) {
  fs.writeFileSync(path.join(SESSION_PATH, key+'.json'), JSON.stringify(sessionData))
}
