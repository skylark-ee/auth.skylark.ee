'use strict'

const CFG = require('../config.json')

const twilio = require('twilio')

const users = require('./users')


module.exports = {
  send
}

function send(userId, code, app, device) {
  const twilio = require('twilio');
  const client = new twilio(CFG.TWILIO.sid, CFG.TWILIO.auth_token);

  const user = users.find(userId)
  if (!user || !user.phone) return Promise.reject('Invalid user or no phone number registered!')

  return client.messages.create({
      body: `Your Skylark SSO code is: ${code} - use it to authenticate your '${device}' device in the ${app} App.`,
      to: user.phone,
      from: CFG.TWILIO.phone_number
  })
  .then((message) => {
    return message
  });
}
