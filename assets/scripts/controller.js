var socket = io()

function sync() { 
    socket.emit("ask_for_sync", {}) 
}

function create_user(username) {
    socket.emit("ask_for_create_user", username)
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

function add_offer(username, offer_duration) {
    socket.emit("ask_for_add_offer", [username, offer_duration])
}

function msToTime(duration) {
    let seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)))

    hours = (hours < 10) ? "0" + hours : hours
    minutes = (minutes < 10) ? "0" + minutes : minutes
    seconds = (seconds < 10) ? "0" + seconds : seconds

    return hours + ":" + minutes + ":" + seconds
}

// On récupère la liste des utilisateurs pour l'autocompletion
socket.on("users_list", (users) => {
    GLOBAL_USERS_LIST = []

    users.forEach(user => {
        GLOBAL_USERS_LIST.push(user.username)
    })
})


function add_user_box(user) {
    let content = `<span class="username">${user.username} ${user.status}</span><br />
                   <span class="time">Temps : ${msToTime(user.time_bank)}</span><br />`

    // Si une offre est en cours
    if (user.offers_end > 0) {
        content += `<span class="offers_end">Offre : ${msToTime(user.offers_end - new Date())}</span><br />`
    }

    content += `<button class="remove" onclick="remove_user_box('${user.username}')">SUPPRIMER</button><br />
                <button class="add_time" onclick="pause_user('${user.username}')">PAUSE</button>
                <button class="add_time" onclick="prompt_add_time('${user.username}')">AJOUTER DU TEMPS</button>`

    let new_box = document.createElement('div')
    new_box.classList = "current-user box"
    new_box.id = "u-" + user.username
    new_box.innerHTML = content

    if (user.time_bank == 0 && user.offers_end <= 0) {
        new_box.style.background = "green"
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

    document.querySelectorAll('div.current-user').forEach((e) => e.remove())
    
    connected_users.forEach(user => {
        update_user_box(user)
    })
})

socket.on("client_generic_callback", (data) => {
    let tag = data[0]

    alert(data[1])
})

sync()
