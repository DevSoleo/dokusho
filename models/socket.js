const mongodb = require('./database')
const { Server } = require('socket.io')
const logs = require('./logs')

exports.io = null

exports.wait = (server) => {
    this.io = new Server(server)

    let User = mongodb.models.User

    this.io.on('connection', (socket) => {        
        socket.on('ask_for_create_user', (infos, callback) => {
            let [username, first_name, last_name, birthday, phone, email] = infos

            User.findOne({ username: username }, {}, function(err, arr) {
                if (arr == null) {
                    if (/^([a-zA-Z0-9]*)$/.test(username)) {
                        User.create({ username: username.toLowerCase().trim(), infos: { first_name: first_name, last_name: last_name, birthday: birthday, phone: phone, email: email }, status: 0, offers_end: 0, time_bank: 0 }, () => {})
                    
                        logs.logUserEvent(username, `Création de l'utilisateur ${username} !`)
                        
                        callback('success')
                    } else {
                        callback('error', 'invalid_character')
                    }
                } else {
                    callback('error', 'user_already_exist')
                }
            })
        })

        socket.on('ask_for_login_user', (username, callback) => {
            User.findOne({ username: username }, {}, function(err, arr){		
                if (arr != null) {
                    if (arr['status'] == 0) {
                        if (arr['time_bank'] > 0 || arr['offers_end'] > Date.now()) {
                            User.updateOne({ username: username }, { status: 1 }, {}, function() {})
                            logs.logUserEvent(username, `Connexion de ${username} avec ${arr['time_bank']}ms de temps`)

                            callback('success')
                        } else {
                            callback('error', 'no_time_remaining')
                        }
                    } else {
                        callback('error', 'already_connected')
                    }
                } else {
                    callback('error', 'user_doesnt_exist')
                }
            })
        })

        socket.on('ask_for_logout_user', (username, callback) => {
            User.findOne({ username: username }, {}, function(err, arr){			
                if (arr != null) {
                    if (arr['status'] == 1 || arr['status'] == 2) {
                        User.updateOne({ username: username }, { status: 0 }, {}, function() {})
                        
                        logs.logUserEvent(username, `Déconnexion de ${username} avec ${arr['time_bank']}ms de temps`)
                        
                        callback('success')
                    } else {
                        callback('error', 'already_connected')
                    }
                } else {
                    callback('error', 'user_doesnt_exist')
                }
            })
        })

        socket.on('ask_for_add_time', (infos, callback) => {
            let username = infos[0]
            let time = parseInt(infos[1])

            User.findOne({ username: username }, {}, function(err, arr){			
                if (arr != null) {
                    User.updateOne({ username: username }, { $inc: { time_bank: time } }, {}, function() {})
                    logs.logUserEvent(username, `Ajout de ${time}ms à ${logs.C_UNDERSCORE + username + logs.C_RESET} (nouveau solde : ${arr['time_bank'] + time}ms)`)
               
                    callback('success')
                } else {
                    callback('error')
                }
            })
        })

        socket.on('ask_for_toggle_pause', (username, callback) => {
            User.findOne({ username: username }, {}, function(err, arr){			
                if (arr != null) {
                    if (arr['status'] == 2) {
                        User.updateOne({ username: username }, { status: 1 }, {}, function() {})
                        logs.logUserEvent(username, `Reprise du décompte du temps de ${logs.C_UNDERSCORE + username + logs.C_RESET}`)
                    } else {
                        User.updateOne({ username: username }, { status: 2 }, {}, function() {})
                        logs.logUserEvent(username, `Mise en pause du décompte du temps de ${logs.C_UNDERSCORE + username + logs.C_RESET}`)
                    }

                    callback('success')
                } else {
                    callback('error')
                }
            })
        })

        socket.on('ask_for_add_offer', (infos, callback) => {
            let username = infos[0]
            let offer_name = infos[1]
            let duration = 0

            let day_duration = (1) * 24 * 60 * 60 * 1000 // 1d

            if (offer_name == "month" || offer_name == "mo") {
                duration = 30 * day_duration
            } else if (offer_name == "week" || offer_name == "we") {
                duration = 7 * day_duration
            } else if (offer_name == "day" || offer_name == "da") {
                duration = (1) * day_duration
            }

            if (duration != 0) {
                User.findOne({ username: username }, {}, function(err, arr) {
                    if (arr != null) {
                        if (arr['offers_end'] == 0) {
                            let offers_end = Date.now() + duration

                            User.updateOne({ username: username }, { offers_end: offers_end}, {}, function() {})
                            
                            logs.logUserEvent(username, `Activation de l'offre ${offer_name} à ${username} (date de fin : ${offers_end})`)
                            
                            callback('success')
                        } else {
                            callback('error', 'remaining_active_offer')
                        }
                    } else {
                        callback('error', 'user_doesnt_exist')
                    }
                })
            } else {
                callback('error', 'invalid_pass_name')
            }
        })

        socket.on('ask_for_remove_offer', (username, callback) => {
            User.findOne({ username: username }, {}, function(err, arr) {
                if (arr != null) {
                    if (arr['offers_end'] != 0) {
                        User.updateOne({ username: username }, { offers_end: 0 }, {}, function() {})

                        logs.logUserEvent(username, `Suppression de l'offre de ${username}.`)

                        callback('success')
                    } else {
                        callback('error', 'no_active_offer')
                    }
                } else {
                    callback('error', 'user_doesnt_exist')
                }
            })
        })

        socket.on('ask_for_users_list', () => {
            User.find({}, (err, arr) => {
                socket.emit('users_list', arr)
            })
        })

        socket.on('ask_for_search_user_by', (infos, callback) => {
            let type = infos[0]
            let content = infos[1]

            if (type == "first_name") {
                console.log("f")
                User.find({ "infos.first_name": content }, (err, arr) => {
                    callback(arr)
                })
            } else if (type == "last_name") {
                console.log("l", content)
                User.find({ "infos.last_name": { $eq: content }}, (err, arr) => {
                    callback(arr)
                })
            }
        })
    })
}