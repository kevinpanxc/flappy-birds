var all = {};

var playing = {};

var STATES = Object.freeze({
    IDLE: 0,
    PLAYING: 1,
    SPECTATING: 2
});

function Client(username, client_id) {
    if (client_id == null) this.id = this.random_string(16, 'aA');
    this.username = username;
    this.y = 180;
    this.x = 27; // 60 units in canvas / 2.2
    this.y_velocity = 0;

    this.state = STATES.IDLE;
}

Client.prototype.random_string = function(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
}

Client.prototype.update_state = function (state) {
    if (state === "IDLE") {
        this.state = STATES.IDLE;
        delete playing[this.id];
    } else if (state === "PLAYING") {
        this.state = STATES.PLAYING;
        playing[this.id] = this;
    } else if (state === "SPECTATING") {
        this.state = STATES.SPECTATING;
        delete playing[this.id];
    }

    this.reset();
}

Client.prototype.reset = function () {
    this.y = 180;
    this.x = 27;
    this.y_velocity = 0;
}

function username_is_valid (username) {
    if (typeof username === 'string'
        && username.length > 0
        && username.length < 20) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    add_new : function (username, client_id) {
        var new_client = null;
        if (username_is_valid(username)) {
            new_client = new Client(username, client_id);
            all[new_client.id] = new_client;
            return new_client;
        } else {
            return false;
        }
    },
    generate_client_package : function (from_client_id) {
        var client_package = {};
        for (client_id in all) {
            client = all[client_id];
            if (from_client_id !== client_id && client.state === STATES.PLAYING) {
                client.time_diff = all[from_client_id].start_game_timestamp - client.start_game_timestamp;
                client_package[client_id] = client;
            }
        }
        return client_package;
    },
    all : all,
    playing : playing,
    STATES : STATES
}