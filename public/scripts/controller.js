var socket = io()

function sync() { 
    socket.emit("ask_for_sync", {}) 
}

function pause_user(username) {
    socket.emit("ask_for_toggle_pause", username, (type) => {
        if (type == "error") {
            alert("Erreur ! Cet utilisateur n'existe pas !")
        }
    })
}






///////////////////////////////////////////////////////

function create_user(args, external_callback) {
    socket.emit("ask_for_create_user", args, (type, reason) => {
        external_callback(type)

        if (type == "success") {
            alert("Succès ! Cet utilisateur a bien été créé !")
        } else if (type == "error") {
            if (reason == "invalid_character") {
                alert("Erreur ! Le username contient un caractère invalide !")
            } else if (reason == "user_already_exist") {
                alert("Erreur ! Cet utilisateur existe déjà !")
            }
        }
    })
}

// LOGIN/OUT
function login_user(username) {
    socket.emit("ask_for_login_user", username, (type, reason) => {
        if (type == "success") {
            sync()
        } else if (type == "error") {
            if (reason == "no_time_remaining") {
                alert(`Erreur ! '${username}' n'a pas de temps restant !`)
            } else if (reason == "already_connected") {
                alert(`Erreur ! '${username}' est déjà connecté !`)
            } else if (reason == "user_doesnt_exist") {
                alert("Erreur ! Cet utilisateur n'existe pas !")
            }
        }
    })
}

function logout_user(username) {
    socket.emit("ask_for_logout_user", username, (type, reason) => {
        if (type == "success") {
            document.querySelectorAll("div.current-user#u-" + username).item(0).remove()

            sync()
        } else if (type == "error") {
            if (reason == "already_connected") {
                alert(`Erreur ! '${username}' est déjà connecté !`)
            } else if (reason == "user_doesnt_exist") {
                alert("Erreur ! Cet utilisateur n'existe pas !")
            }
        }
    })
}

// TIME
function add_time(username, time, external_callback = () => {}) {
    socket.emit("ask_for_add_time", [username, time], (type) => {
        external_callback(type)

        if (type == 'success') {
            alert(`Succès ! Temps ajouté à '${username}' !`)
        } else {
            alert("Erreur ! Cet utilisateur n'existe pas !")
        }
    })
}

function prompt_add_time(username) {
    let time = prompt(`Saisissez le temps à ajouter à ${username} (en minutes) :`)

    add_time(username, time * 60 * 1000)
}

// PASS
function add_offer(username, offer_name, external_callback = () => {}) {
    if (offer_name != "") {
        socket.emit("ask_for_add_offer", [username, offer_name], (type, reason) => {
            external_callback(type, reason)

            if (type == 'success') {
                alert(`Succès ! Pass ajouté à '${username}' !`)
            } else if (type == 'error') {
                if (reason == 'user_doesnt_exist') {
                    alert("Erreur ! Cet utilisateur n'existe pas !")
                } else if (reason == 'remaining_active_offer') {
                    alert("Erreur ! Cet utilisateur a déjà un pass en cours !")
                } else if (reason == 'invalid_pass_name') {
                    alert("Erreur ! Nom du pass invalide !")
                }
            }
        })
    } else {
        alert("Erreur ! Nom de pass invalide !")
    }
}

function prompt_add_offer(username) {
    let offer_name = prompt(`Saissisez le nom de l'offre à ajouter à '${username}' :`)

    add_offer(username, offer_name)
}

function remove_offer(username) {
    socket.emit("ask_for_remove_offer", username, (type, reason) => {
        if (type == 'success') {
            // alert(`Pass retiré de ${username} !`)
        } else if (type == 'error') {
            if (reason == 'user_doesnt_exist') {
                alert("Erreur ! Cet utilisateur n'existe pas !")
            } else if (reason == 'no_active_offer') {
                alert("Erreur ! Cet utilisateur n'a aucun pass en cours !")
            }
        }
    })
}

function search_user_by(type, content) {
    socket.emit("ask_for_search_user_by", [type, content], (list) => {
        let content = ''
        
        list.forEach((user) => {
            content += user.infos.first_name + " " + user.infos.last_name + " (username : " + user.username + ")\n"
        })

        alert(content)
    })
}

//////////////////////////////////////////////////////////:

function msToTime(duration) {
    let seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24),
        days = parseInt((duration / (1000 * 60 * 60 * 24)))

    hours = (hours < 10) ? "0" + hours : hours
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds

    result = ""

    if (days != 0) result += days + "d"
    if (hours != 0) result += hours + "h"
    if (minutes != 0) result += minutes + "m"
    if (seconds != 0) result += seconds + "s"
    if (seconds == 0) result += "00s"

    if (result == "") result = "0s"

    return result
}

function add_user_box(user) {
    let content = `<span class='box-username-text'>${user.username}</span><br />`

    // Temps

    // Si une offre est en cours

    if (user.offers_end > 0) {
        content += `<span class='box-time-text'>(P) ${msToTime(user.offers_end - new Date())}</span><br />`
        content += `<button class='box-control-button' onmousedown="logout_user('${user.username}')">MASQUER</button><br />`

    } else {
        if (user.time_bank > 0) {
            content += `<span class='box-time-text'>(T) ${msToTime(user.time_bank)}</span><br />`
        }
        content += `<button class='box-control-button' onmousedown="logout_user('${user.username}')">SUPPRIMER</button><br />`
    }

    if (user.time_bank > 0) {
        // Si l'utilisateur est en pause
        if (user.status == 2) {
            content += `<button class='box-control-button' onmousedown="pause_user('${user.username}')">REPRENDRE</button>`
        } else if (user.status == 1) {
            content += `<button class='box-control-button' onmousedown="pause_user('${user.username}')">PAUSE</button>`
        } 
    }

    // Si une offre est en cours
    if (user.offers_end > 0) {
        content += `<button class='box-control-button' onmousedown="remove_offer('${user.username}')">RETIRER L'OFFRE</button>`
    } else {
        content += `<button class='box-control-button' onmousedown="prompt_add_offer('${user.username}')">AJOUTER UNE OFFRE</button>`
    }

    content += `<button class='box-control-button' onmousedown="prompt_add_time('${user.username}')">AJOUTER DU TEMPS</button>`

    // Boite
    let new_box = document.createElement('div')
    new_box.classList = "current-user box"
    new_box.id = "u-" + user.username
    new_box.innerHTML = content

    // Si l'utilisateur n'a plus de temps (rouge)
    if (user.time_bank == 0 && user.offers_end <= 0) new_box.style.background = '#EF5350'

    // Si l'utilisateur est en pause (jaune)
    if (user.status == 2) new_box.style.background = '#FBC02D'

    document.querySelectorAll("div.boxes").item(0).prepend(new_box)
}

function update_user_box(user) {
    let qbox = document.querySelectorAll('div.current-user#u-' + user.username).item(0)

    if (qbox == null) {
        add_user_box(user)
    }
}

function iterate_fake_form(fields_ids, action) {
    for (let i = 0; i < fields_ids.length;i++) {
        let tag = document.getElementById(fields_ids[i])

        action(tag)
    }
}

function clear_fake_form(fields_ids) {
    iterate_fake_form(fields_ids, (tag) => {
        tag.value = ''
    })
}

// Actualisation de l'affichage des utilisateurs  
// connectés (status = 1) ou en pause (status = 2)
socket.on('sync', (connected_users) => {
    socket.emit('ask_for_users_list', {})

    // On supprime toutes les cases déjà existantes, pour les réafficher
    document.querySelectorAll('div.current-user').forEach((e) => e.remove())
    
    // On affiche les utilisateurs n'ayant plus de temps en premier
    connected_users.forEach(user => { if (user.time_bank != 0) update_user_box(user) })
    connected_users.forEach(user => { if (user.time_bank == 0) update_user_box(user) })
})

sync()

// Autocompletion
// On récupère la liste des utilisateurs pour l'autocompletion
socket.on("users_list", (users) => {
    GLOBAL_USERS_LIST = []

    users.forEach(user => {
        GLOBAL_USERS_LIST.push(user.username)
    })
})

var GLOBAL_USERS_LIST = []

function custom_autocomplete(input) {
    if (input.length < 1) return []

    return GLOBAL_USERS_LIST.filter(user => { return user.toLowerCase().startsWith(input.toLowerCase()) })
}

new Autocomplete('#autocomplete-0', { search: input => custom_autocomplete(input) })    
new Autocomplete('#autocomplete-1', { search: input => custom_autocomplete(input) })    