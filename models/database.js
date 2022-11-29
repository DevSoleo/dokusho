const mongoose = require('mongoose')
const logs = require('./logs')

exports.models = { User: mongoose.model('User', { username: String, infos: { first_name: String, last_name: String, birthday: String, phone: String, email: String }, time_bank: Number, status: Number, offers_end: Number }) }

exports.connect = (uri) => {
    logs.logSystemEvent("Tentative de connexion à la base de données !")

    mongoose.connect(uri).then(
        () => {
            logs.logSystemEvent("Connexion à la base de données réussie !")
        },
        err => {
            logs.logSystemEvent("Echec de la connexion à la base de données !")

            process.exit(1)
        }
    )
}