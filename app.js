const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const io = new Server(server)
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/dokusho')

// Custom modules
var logs = require('./logs')

const User = mongoose.model('User', { username: String, time_bank: Number, status: Number, offers_end: Number })

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
}).get('/scripts/controller.js', (req, res) => {
	res.sendFile(__dirname + '/assets/scripts/controller.js')
})

io.on('connection', (socket) => {
	
	socket.on('ask_for_create_user', (username) => {
		User.findOne({ username: username }, {}, function(err, arr){		
			if (arr == null) {
				User.create({ username: username, status: 1, offers_end: 0, time_bank: 0 }, () => {})
				logs.logUserEvent(username, `Création de l'utilisateur ${username} !`)
				
				socket.emit('client_generic_callback', ['ask_for_create_user', "Cet utilisateur a bien été créé !", 'success'])
			} else {
				socket.emit('client_generic_callback', ['ask_for_create_user', "Cet utilisateur existe déjà !", 'error'])
			}
		})
	})

	// Lorsqu'un client arrive IRL
	socket.on('ask_for_login_user', (username) => {
		User.findOne({ username: username }, {}, function(err, arr){		
			if (arr != null) {
				if (arr['status'] == 0) {
					if (arr['time_bank'] > 0 || arr['offers_end'] > Date.now()) {
						User.updateOne({ username: username }, { status: 1 }, {}, function() {})
						logs.logUserEvent(username, `Connexion de ${username} avec ${arr['time_bank']}ms de temps`)
					} else {
						// plus de temps
						socket.emit('client_generic_callback', ['ask_for_login_user', `${username} n'a plus de temps restant !`])
					}
				} else {
					// utilisateur deja connecte
					socket.emit('client_generic_callback', ['ask_for_login_user', `${username} est déjà connecté !`])
				}
			} else {
				socket.emit('client_generic_callback', ['ask_for_login_user', "Cet utilisateur n'existe pas !"])
			}
		})
	})

	socket.on('ask_for_logout_user', (username) => {
		User.findOne({ username: username }, {}, function(err, arr){			
			if (arr != null) {
				if (arr['status'] == 1 || arr['status'] == 2) {
					User.updateOne({ username: username }, { status: 0 }, {}, function() {})
					logs.logUserEvent(username, `Déconnexion de ${username} avec ${arr['time_bank']}ms de temps`)
				} else {
					// utilisateur deja connecte
					socket.emit('client_generic_callback', ['ask_for_logout_user', `${username} n'est pas connecté !`])
				}
			} else {
				socket.emit('client_generic_callback', ['ask_for_logout_user', "Cet utilisateur n'existe pas !"])
			}
		})
	})

	socket.on('ask_for_add_time', (infos) => {
		let username = infos[0]
		let time = parseInt(infos[1])

		User.findOne({ username: username }, {}, function(err, arr){			
			if (arr != null) {
				User.updateOne({ username: username }, { $inc: { time_bank: time } }, {}, function() {})
				logs.logUserEvent(username, `Ajout de ${time}ms à ${logs.C_UNDERSCORE + username + logs.C_RESET} (nouveau solde : ${arr['time_bank'] + time}ms)`)
			} else {
				socket.emit('client_generic_callback', ['ask_for_logout_user', "Cet utilisateur n'existe pas !"])
			}
		})
	})

	socket.on('ask_for_toggle_pause', (infos) => {
		let username = infos[0]

		User.findOne({ username: username }, {}, function(err, arr){			
			if (arr != null) {
				if (arr['status'] == 2) {
					User.updateOne({ username: username }, { status: 1 }, {}, function() {})
					logs.logUserEvent(username, `Reprise du décompte du temps de ${logs.C_UNDERSCORE + username + logs.C_RESET}.`)
				} else {
					User.updateOne({ username: username }, { status: 2 }, {}, function() {})
					logs.logUserEvent(username, `Mise en pause du décompte du temps de ${logs.C_UNDERSCORE + username + logs.C_RESET}.`)
				}
			} else {
				socket.emit('client_generic_callback', ['ask_for_logout_user', "Cet utilisateur n'existe pas !"])
			}
		})
	})

	socket.on('ask_for_add_offer', (infos) => {
		let username = infos[0]
		let offer_duration = parseInt(infos[1])

		User.findOne({ username: username }, {}, function(err, arr) {
			if (arr != null) {
				if (arr['offers_end'] == 0) {
					let offers_end = Date.now() + offer_duration

					User.updateOne({ username: username }, { offers_end: offers_end}, {}, function() {})
					logs.logUserEvent(username, `Activation de l'offre ${offer_duration}ms à ${username} (date de fin : ${offers_end})`)
				} else {
					socket.emit('client_generic_callback', ['ask_for_logout_user', "Cet utilisateur a déjà une offre en cours !"])
				}
			} else {
				socket.emit('client_generic_callback', ['ask_for_logout_user', "Cet utilisateur n'existe pas !"])
			}
		})
	})

	socket.on('ask_for_users_list', () => {
		User.find({}, (err, arr) => {
			socket.emit('users_list', arr)
		})
	})
})

// Heartbeat
setInterval(function() {
	// Desactivation des offres lorsqu'elles arrivent a expiration
    User.updateMany({ offers_end: { $lte: Date.now() } }, { offers_end: 0 }, () => {})

	// Reduction du temps pour les utilisateurs connectés ayant du temps restant et n'ayant pas d'offres
    User.updateMany({ 'status': 1, time_bank: {$gte: 1000}, offers_end: { $lt: Date.now() } }, { $inc: { time_bank: -1000 } }, () => {})

	// Envoie de la liste des utilisateurs connectés aux clients
	User.find({ $or: [ { 'status': 1 }, { 'status': 2 } ] }, (err, arr) => {
		io.local.emit('sync', arr)
	})

    // console.log("tick")
}, 1000)

server.listen(3000, () => { console.log("Ouvrir http://localhost:3000 dans votre navigateur")})