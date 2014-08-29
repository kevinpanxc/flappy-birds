var client_module = require("./client_module");

var Game = (function () {
    var gravity = 0.7;
    var jump = -6;

    return {
        game_loop : function () {
            for (var client_id in client_module.playing) {
                var client = client_module.playing[client_id];
                if (client.state === client_module.STATES.PLAYING) {
                    client.y_velocity += gravity;
                    client.y += client.y_velocity;
                    client.x += 1.65;
                    if (client.y > 393) {
                        client.y_velocity = 0;
                        client.y = 393;
                    }
                }
            }
        },

        jump : function (client_id) {
            var client = client_module.playing[client_id];
            if (client) {
                client.y_velocity = jump;
            }
        }
    }
})();

module.exports = Game;