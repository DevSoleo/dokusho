// Bouton "Créer un utilisateur" est cliqué
document.getElementById("create_user_submit").addEventListener("click", () => {
    let fields_ids = [ "create_user_username", "create_user_firstname", "create_user_lastname", "create_user_birthday", "create_user_phone", "create_user_email" ]
    let args = []

    iterate_fake_form(fields_ids, (tag) => {
        if (tag != null) {
            args[args.length] = tag.value.toLowerCase()
        } else {
            args[args.length] = ''
        }
    })

    // Si (au minimum) le username est renseigné
    if (args[0] != '') {
        create_user(args, (type) => {
            if (type == 'success') {
                clear_fake_form(fields_ids)
            }
        })
    } else {
        alert("Erreur ! Username manquant !")
    }
})

// Bouton "Ajouter du temps" est cliqué
document.getElementById("add_time_submit").addEventListener("click", () => {
    let fields_ids = [ "add_time_day", "add_time_hour", "add_time_min" ]
    let username = document.getElementById("add_time_username").value.toLowerCase()

    let total_time = 0

    iterate_fake_form(fields_ids, (tag) => {
        if (tag.id == "add_time_day") {
            total_time += tag.value * 24 * 60 * 60 * 1000
        } else if (tag.id == "add_time_hour") {
            total_time += tag.value * 60 * 60 * 1000
        } else if (tag.id == "add_time_min") {
            total_time += tag.value * 60 * 1000
        }
    })

    if (total_time > 0) {
        add_time(username, total_time, (type) => {
            if (type == 'success') {
                clear_fake_form(["add_time_username"].concat(fields_ids))
            }
        })
    } else {
        alert("Erreur ! Valeurs manquantes !")
    }
})

// Bouton "Ajouter un pass" est cliqué
document.getElementById("add_offer_submit").addEventListener("click", () => {
    let fields_ids = [ "add_offer_username", "add_offer_pass" ]

    let username = document.getElementById(fields_ids[0]).value.toLowerCase()
    let pass_name = document.getElementById(fields_ids[1]).value.toLowerCase()

    add_offer(username, pass_name, (type, reason) => {
        if (type == 'success') {
            clear_fake_form(fields_ids)
        }
    })
})

// Bouton "+" cliqué
document.querySelectorAll("div.boxes div.add-user.box").item(0).addEventListener("click", () => {
    let username = prompt("Username :")

    if (username != null) {
        login_user(username.toLowerCase())
    }
})