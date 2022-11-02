const mongoose = require('mongoose');
const { logGlobalEvent, logErrorEvent, logSystemEvent } = require('./logs');

exports.models = { User: mongoose.model('User', { username: String, phone: String, time_bank: Number, status: Number, offers_end: Number }) }

exports.connect = (uri) => {
    logSystemEvent("Tentative de connexion à la base de données !")

    mongoose.connect(uri).then(
        () => {
            logSystemEvent("Connexion à la base de données réussie !")
        },
        err => {
            logSystemEvent("Echec de la connexion à la base de données !")

            setTimeout(() => {
                process.exit(1)
            }, 500)
        }
    )
}