const mongodb = require('./database')

exports.start = (io) => {
    let User = mongodb.models.User

    // Heartbeat
    setInterval(function() {
        // Desactivation des offres lorsqu'elles arrivent a expiration
        User.updateMany({ offers_end: { $lte: Date.now() } }, { offers_end: 0 }, () => {})

        // Reduction du temps pour les utilisateurs connectés ayant du temps restant et n'ayant pas d'offres
        User.updateMany({ 'status': 1, time_bank: {$gte: 1000}, offers_end: { $lt: Date.now() } }, { $inc: { time_bank: -1000 } }, () => {})

        // Envoie de la liste des utilisateurs connectés aux clients
        User.find({ $or: [ { 'status': 1 }, { 'status': 2 } ] }).sort({ status : 1}).exec((err, arr) => {
            io.local.emit('sync', arr)
        })

        // console.log("tick")
    }, 1000)
}