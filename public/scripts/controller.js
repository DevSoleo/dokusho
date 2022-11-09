var socket = io()

function sync() { 
    socket.emit("ask_for_sync", {}) 
}

function create_user(username, first_name, last_name, birthday, phone, email) {
    socket.emit("ask_for_create_user", [username, first_name, last_name, birthday, phone, email])
}

function login_user(username) {
    socket.emit("ask_for_login_user", username)

    sync()
}

function logout_user(username) {
    socket.emit("ask_for_logout_user", username)

    sync()
}

function remove_user_box(username) {
    document.querySelectorAll("div.current-user#u-" + username).item(0).remove()
    
    logout_user(username)
}

function add_time(username, time) {
    socket.emit("ask_for_add_time", [username, time])
}

function pause_user(username) {
    socket.emit("ask_for_toggle_pause", [username])
}

function prompt_add_time(username) {
    let time = prompt(`Saisissez le temps à ajouter à ${username} (en ms) :`)

    add_time(username, time)
}

function add_offer(username, offer_name) {
    duration = 0

    if (offer_name == "month" || offer_name == "mo") {
        duration = (1) * 30 * 24 * 60 * 60 * 1000 // 1 Mois (30 jours)
    } else if (offer_name == "week" || offer_name == "we") {
        duration = (1) * 7 * 24 * 60 * 60 * 1000 // 7 jours
    } else if (offer_name == "day" || offer_name == "da") {
        duration = (1) * 24 * 60 * 60 * 1000 // 1 jour
    }

    if (duration > 0) {
        socket.emit("ask_for_add_offer", [username, duration])
    } else {
        alert("Erreur !")
    }
}

function remove_offer(username) {
    socket.emit("ask_for_remove_offer", [username])
}

function prompt_add_offer(username) {
    let offer_name = prompt(`Saissisez le nom de l'offre à ajouter à ${username} :`)

    add_offer(username, offer_name)
}

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

    if (result == "") result = "0s"

    return result
}

// On récupère la liste des utilisateurs pour l'autocompletion
socket.on("users_list", (users) => {
    GLOBAL_USERS_LIST = []

    users.forEach(user => {
        GLOBAL_USERS_LIST.push(user.username)
    })
})

function add_user_box(user) {
    let content = `<span class="username">${user.username}</span><br />`

    // Temps

    // Si une offre est en cours

    if (user.offers_end > 0) {
        content += `<span class="time" style='color: gray; opacity: 0.5;'>Temps : ${msToTime(user.time_bank)}</span><br />`
        content += `<span class="offers_end" style='font-weight: bold;'>Offre : ${msToTime(user.offers_end - new Date())}</span><br />`
    } else {
        if (user.time_bank > 0) {
            content += `<span class="time">Temps : ${msToTime(user.time_bank)}</span><br />`
        }
    }

    // Boutons

    content += `<button class="remove" onmousedown="remove_user_box('${user.username}')">SUPPRIMER</button><br />`

    if (user.time_bank > 0) {
        // Si l'utilisateur est en pause
        if (user.status == 2) {
            content += `<button class="pause" onmousedown="pause_user('${user.username}')">REPRENDRE</button>`
        } else if (user.status == 1) {
            content += `<button class="pause" onmousedown="pause_user('${user.username}')">PAUSE</button>`
        } 
    }

    // Si une offre est en cours
    if (user.offers_end > 0) {
        content += `<button class="add_offer" onmousedown="remove_offer('${user.username}')">RETIRER L'OFFRE</button>`
    } else {
        content += `<button class="add_offer" onmousedown="prompt_add_offer('${user.username}')">AJOUTER UNE OFFRE</button>`
    }

    content += `<button class="add_time" onmousedown="prompt_add_time('${user.username}')">AJOUTER DU TEMPS</button>`

    // Boite
    let new_box = document.createElement('div')
    new_box.classList = "current-user box"
    new_box.id = "u-" + user.username
    new_box.innerHTML = content

    if (user.time_bank == 0 && user.offers_end <= 0) {
        new_box.style.background = "red"
    }

    // Si l'utilisateur est en pause
    if (user.status == 2) {
        new_box.style.background = "yellow"
    } 

    document.querySelectorAll("div.boxes").item(0).prepend(new_box)
}

function update_user_box(user) {
    let qbox = document.querySelectorAll('div.current-user#u-' + user.username).item(0)

    if (qbox == null) {
        add_user_box(user)
    }
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

socket.on("client_generic_callback", (data) => {
    alert(data[1])
})

sync()

// ================= CONTROL =================

var GLOBAL_USERS_LIST = []

function custom_autocomplete(input) {
    if (input.length < 1) return []

    return GLOBAL_USERS_LIST.filter(user => { return user.toLowerCase().startsWith(input.toLowerCase()) })
}

new Autocomplete('#autocomplete-0', { search: input => custom_autocomplete(input) })    
new Autocomplete('#autocomplete-1', { search: input => custom_autocomplete(input) })    

document.querySelectorAll("div.boxes div.add-user.box").item(0).addEventListener("click", () => {
    let username = prompt("Username :")

    if (username != null) login_user(username.toLowerCase())
})

document.querySelectorAll("div.control-panel div.create-user-part button").item(0).addEventListener("click", () => {
    let username = document.querySelectorAll("div.control-panel div.create-user-part input[type=text]#username").item(0).value.toLowerCase()
    let first_name = document.querySelectorAll("div.control-panel div.create-user-part input[type=text]#first_name").item(0).value.toLowerCase()
    let last_name = document.querySelectorAll("div.control-panel div.create-user-part input[type=text]#last_name").item(0).value.toLowerCase()
    let birthday = document.querySelectorAll("div.control-panel div.create-user-part input[type=text]#birthday").item(0).value.toLowerCase()
    let phone = document.querySelectorAll("div.control-panel div.create-user-part input[type=text]#phone").item(0).value.toLowerCase()
    let email = document.querySelectorAll("div.control-panel div.create-user-part input[type=email]#email").item(0).value.toLowerCase()

    create_user(username, first_name, last_name, birthday, phone, email)
})

document.querySelectorAll("div.control-panel div.manage-time-box button").item(0).addEventListener("click", () => {
    add_time(
        document.querySelectorAll("div.control-panel div.manage-time-box input[type=text]").item(0).value.toLowerCase(),
        document.querySelectorAll("div.control-panel div.manage-time-box input[type=number]").item(0).value
    )
})

document.querySelectorAll("div.control-panel div.manage-time-box button").item(1).addEventListener("click", () => {
    add_offer(
        document.querySelectorAll("div.control-panel div.manage-time-box input[type=text]").item(1).value.toLowerCase(),
        document.querySelectorAll("div.control-panel div.manage-time-box input[type=text]").item(1).value.toLowerCase()
    )
})
