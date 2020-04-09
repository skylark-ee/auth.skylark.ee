'use strict'

const CFG = require('../config.json')

const qs = require('querystring')

const ppc = require('ppc-messaging')

const users = require('../lib/users')
const sessions = require('../lib/sessions')

// Pluggable OTP (one-time-password) solution
// Using the Twilio programmable SMS API right now
const otp = require('../lib/otp-twilio')




module.exports = {
  handler
}

function handler(req, res) {
  let sess, client;
  try {
    sess = sessions.load(req.query['k'])
    client = CFG.CLIENTS.filter(client => client.client_id === sess.request.client_id)[0]
  }
  catch(e) {}

  // Bad session
  if (!sess) {
    return res.status(403).send('Invalid auth session.')
  }

  // Bad client
  if (!client) {
    return res.status(403).send('Unknown auth client.')
  }

  // Too many failed attempts
  if (sess.attempts > 10) {
    return res.status(403).send('Too many failed attempts.')
  }

  // Challenge response given
  if (req.body['key'] || req.body['login-otp']) {
    loginFinish(req, res, { sess, client })

  // Username given, send challenge
  } else if (req.body['username'] || req.body['login-main']) {
    loginOTP(req, res, { sess, client })

  // Initial phase, ask for username etc.
  } else {
    loginMain(req, res, {sess, client})
  }
}


function loginMain(req, res, data = {}) {
  const { sess, client } = data

  // Merge passed-in data with the default template data
  let templateData = Object.assign({
    title: 'Please log in...',
    default_user_id: req.cookies['last-user-id']||''
  }, data)

  res.render('login.html', templateData)
}

function loginOTP(req, res, data = {}) {
  const { sess, client } = data

  // Check the provided user name
  const user = users.find(req.body['username'])

  // Unknown user
  if (!user) {
    res.sendStatus(403)
  }

  // Link user to session
  sess.user = user

  // Extra fields
  const prefix = 'skylark-notes-' // TODO:generalize
  sess.extra_fields = Object.keys(req.body)
    .filter(k => k.substr(0,prefix.length) === prefix)
    .map(k => ({ field: k, value: req.body[k] }))


  // Generate challenge passkey
  sess.challenge = {
    code: ppc.randomString(6),
    expires: Date.now()*90*1000  // 90s
  }

  // Update session
  sessions.save(sess.k, sess)

  // Send out one-time password and show OTP input form
  otp.send(sess.user.id, sess.challenge.code, 'Skylark Notes', sess.extra_fields[0].value)
    .then(msg => {
      res.render('challenge.html', {
        title: 'Enter passcode:',
        username: sess.user.id
      })
    })
}

function loginFinish(req, res, data = {}) {
  const { sess, client } = data

  // Check expiry
  if (sess.challenge.expires < Date.now()) {
    // expired, send new challenge
    sess.attempts = sess.attempts+1 || 1
    sessions.save(sess.k, sess)

    return loginOTP(req, res, { sess, client,
      message: `One time password expired, please try again.`
    })
  }

  // Check key
  if (sess.challenge.code !== req.body['key']) {
    // invalid code
    sess.attempts = sess.attempts+1 || 1
    sessions.save(sess.k, sess)

    return loginOTP(req, res, { sess, client,
      message: `One time password incorrect.`
    })
  }

  // Generate long-lived session id
  sess.session_id = `${sess.k}:${ppc.randomString(64)}`
  sess.session_date = new Date()
  sessions.save(sess.k, sess)

  // Send encrypted authentication results back to calling app
  const msg = {
    user: sess.user.id,
    name: sess.user.name,
    extra_fields: sess.extra_fields,
    session_id: sess.session_id
  }
  const pm = ppc.encryptResponse(sess.request.msg_id, sess.request.client_id, msg)

  // Save user id for future autofill
  res.cookie('last-user-id', sess.user.id, {
    maxAge: 365*24*3600*1000 // 1 year
  })

  // Redirect back to calling app
  return res.redirect(client.auth_url + '?' + qs.stringify({
    pm: pm
  }))
}
