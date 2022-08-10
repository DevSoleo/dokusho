const fs = require('fs')

/*
// NOT USED
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
*/

exports.C_RESET = "\x1b[0m"
exports.C_UNDERSCORE  = "\x1b[4m"

exports.C_FG_BLACK = "\x1b[30m"
exports.C_FG_RED = "\x1b[31m"
exports.C_FG_GREEN = "\x1b[32m"
exports.C_FG_YELLOW = "\x1b[33m"
exports.C_FG_BLUE = "\x1b[34m"
exports.C_FG_MAGENTA = "\x1b[35m"
exports.C_FG_CYAN = "\x1b[36m"
exports.C_FG_WHITE = "\x1b[37m"

exports.C_BG_BLACK = "\x1b[40m"
exports.C_BG_RED = "\x1b[41m"
exports.C_BG_GREEN = "\x1b[42m"
exports.C_BG_YELLOW = "\x1b[43m"
exports.C_BG_BLUE = "\x1b[44m"
exports.C_BG_MAGENTA = "\x1b[45m"
exports.C_BG_CYAN = "\x1b[46m"
exports.C_BG_WHITE = "\x1b[47m"

function addZero(number) {
    if (number < 10) number = '0' + number;

    return number
}

function getFormattedDate() {
    let date = new Date()

    let day = addZero(date.getDate()) + "-" + addZero(date.getMonth() + 1) + "-" + date.getFullYear()
    let time = addZero(date.getHours()) + ":" + addZero(date.getMinutes()) + ":" + addZero(date.getSeconds())

    return day + " " + time
  }


exports.logGlobalEvent = (content) => {
    let log_marker = `[${getFormattedDate()}] [logGlobalEvent] `

    let file_log = log_marker + content.replace(/\u001b[^m]*?m/g,"") + '\n'
    let console_log = log_marker + content

	fs.appendFile("logs/global_logs.txt", file_log, function (err) {
        console.log(console_log)
    })
}

exports.logUserEvent = (username, content) => {
    this.logGlobalEvent(content)

    let log_marker = `[${getFormattedDate()}] [logGlobalEvent] `
    let file_log = log_marker + content.replace(/\u001b[^m]*?m/g,"") + '\n'

    fs.appendFile(`logs/users/${username}_logs.txt`, file_log + '\n', function (err) {})
}