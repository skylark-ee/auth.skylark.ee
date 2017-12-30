'use strict'

const CFG = require('../config.json')

const qs = require('querystring')

const ppc = require('ppc-messaging')

const sessions = require('../lib/sessions')


module.exports = {
  handler
}

// Handles incoming external auth requests and initiates a login flow
// for authentication.
function handler(req, res) {
  // set up initial session
  let sess = sessions.create()

  // No client specified
  const client = CFG.CLIENTS.filter(client => client.id === req.query.c)[0]
  if (!client) {
    return res.status(403).send('Unknown auth client.')
  }

  // Request contents
  const pm = req.query['pm']
  try {
    sess.request = ppc.decryptMessage(client.keys.private, pm)
  }
  catch (e) {
    console.log(e)
    return res.status(403).send('Invalid authentication request.')
  }

  // Compare client id
  if (sess.request.client_id !== client.client_id) {
    return res.status(403).send('Unknown client request.')
  }

  // Persist updated session data
  sessions.save(sess.k, sess)

  // Start new login flow
  return res.redirect('/api/login?' + qs.stringify({
    k: sess.k
  }))

}
