const express = require('express')
const http = require('http')

const socket = require('./models/socket')
const hearbeat = require('./models/heartbeat')
const mongodb = require('./models/database')

const app = express()

// Tentative de connexion à la base de données
mongodb.connect(`mongodb://${process.env.MONGO_DB_HOST}:27017/dokusho`)

// Lancement du serveur web
const server = http.createServer(app)

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
}).get('/scripts/controller.js', (req, res) => {
	res.sendFile(__dirname + '/public/scripts/controller.js')
}).get('/scripts/events.js', (req, res) => {
	res.sendFile(__dirname + '/public/scripts/events.js')
}).get('/styles/base.css', (req, res) => {
	res.sendFile(__dirname + '/public/styles/base.css')
})

// Récupération des requêtes entrantes
socket.wait(server)

hearbeat.start(socket.io)

server.listen(3000)
