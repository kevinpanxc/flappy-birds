var client_module = require("./client_module");

var Game = (function () {
    var gravity = 1;
    var jump = -12;

    return {
        game_loop : function () {
            for (var client_id in client_module.playing) {
                var client = client_module.playing[client_id];
                if (client.state === client_module.STATES.PLAYING) {
                    // client.velocity += gravity;
                    // client.y += client.velocity;
                    client.x += 5;
                    if (client.y > 393) {
                        client.velocity = 0;
                        client.y = 393;
                    }
                }
            }
        },

        jump : function (client_id) {
            var client = client_module.playing[client_id];
            if (client) {
                // client.velocity = jump;
            }
        }
    }
})();

module.exports = Game;