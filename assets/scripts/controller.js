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

/*
    autoCompleteJS.data.src = []
*/

socket.on("users_list", (users) => {
    GLOBAL_USERS_LIST = []

    users.forEach(user => {
        GLOBAL_USERS_LIST.push(user.username)
    })
})

// Information sync
socket.on("sync", (connected_users) => {
    socket.emit("ask_for_users_list", {})

    document.querySelectorAll("div.current-user").forEach((e) => {
        e.remove()
    })

    connected_users.forEach(user => {
        let box = document.querySelectorAll("div.current-user#u-" + user.username).item(0)
        
        let html = `<span class="username">${user.username}</span><br />
                    <span class="time">Temps : ${msToTime(user.time_bank)}</span><br />`

        if (user.offers_end > 0) html += `<span class="offers_end">Offre : ${msToTime(user.offers_end - new Date())}</span><br />`

        html += `<button class="remove" onclick="console.log('ok'); remove_user_box('${user.username}')">SUPPR.</button><br />
                 <button class="add_time" onclick="prompt_add_time('${user.username}')">ADD TIME</button>`

        if (box == null) {
            // Create box

            let new_box = document.createElement("div")
            new_box.classList = "current-user box"
            new_box.id = "u-" + user.username
            new_box.innerHTML = html

            if (user.time_bank == 0 && user.offers_end <= 0) {
                new_box.style.background = "red"
            }

            document.querySelectorAll("div.boxes").item(0).prepend(new_box)
        }
    })
})

socket.on("client_generic_callback", (data) => {
    let tag = data[0]

    alert(data[1])
})

sync()