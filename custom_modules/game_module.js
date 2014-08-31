var client_module = require("./client_module");

var Game = (function () {
    return {
        game_loop : function () {
            for (var client_id in client_module.playing) {
                var client = client_module.playing[client_id];
                if (!client.dead && client.state === client_module.STATES.PLAYING) client.x += 1.65;
            }
        }
    }
})();

module.exports = Game;