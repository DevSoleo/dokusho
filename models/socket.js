const mongodb = require('./database')

const { Server } = require('socket.io')

const logs = require('./logs');

exports.io = null

exports.wait = (server) => {
    this.io = new Server(server)

    let User = mongodb.models.User

    this.io.on('connection', (socket) => {        
        socket.on('ask_for_create_user', (infos) => {
            let username = infos[0]
            let first_name = infos[1]
            let last_name = infos[2]
            let birthday = infos[3]
            let phone = infos[4]
            let email = infos[5]
            
            User.findOne({ username: username }, {}, function(err, arr){		
                if (arr == null) {
                    User.create({ username: username, infos: { first_name: first_name, last_name: last_name, birthday: birthday, phone: phone, email: email }, status: 0, offers_end: 0, time_bank: 0 }, () => {})
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
                            socket.emit('client_generic_callback', ['ask_for_login_user', `${username} n'a pas de temps restant !`])
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

        socket.on('ask_for_remove_offer', (infos) => {
            let username = infos[0]

            User.findOne({ username: username }, {}, function(err, arr) {
                if (arr != null) {
                    if (arr['offers_end'] != 0) {
                        User.updateOne({ username: username }, { offers_end: 0 }, {}, function() {})
                        logs.logUserEvent(username, `Suppression de l'offre de ${username}.`)
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
}