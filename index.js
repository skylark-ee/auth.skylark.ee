'use strict'

const CFG = require('./config.json')

const path = require('path')

const express = require('express')
const cookieParser = require('cookie-parser')
const nunjucks = require('nunjucks')


// Create Express app
const app = new express()

// Configure templating
nunjucks.configure('views', {
    autoescape: true,
    express: app
})

// Static assets
app.use(express.static(path.join(__dirname, 'www')))
app.use(express.static(path.join(__dirname, './data/build/')))


// API endpoints

// Authorization request
app.get('/api/auth', require('./api/auth').handler)

// Login flow
app.all('/api/login', cookieParser(), express.urlencoded({extended:false}), require('./api/login').handler)


// Start server
app.listen(4739, _ => console.log(`Started on :4739`))
