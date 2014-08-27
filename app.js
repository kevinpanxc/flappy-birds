// express and sockets setup
var express = require("express");
var app = express();
var port = Number(process.env.PORT || 3700);

app.use(express.static(__dirname + '/assets'));
app.get('/', function(request, response) {
    response.sendfile('./assets/index.html');
});

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

// custom modules
var client_module = require("./custom_modules/client_module");
var pipe_module = require("./custom_modules/pipe_module");
var game_module = require("./custom_modules/game_module");

// services
var refresh_client_score_service;
var refresh_client_temp_service;
var game_loop_service;

io.sockets.on('connection', function (socket) {
    socket.on('register-request', function (data) {
        var new_client = client_module.add_new(data, null);

        if (new_client !== false) {
            var return_package = { 
                client_id : new_client.id, 
                username : new_client.username, 
                clients : client_module.all,
                pipes : pipe_module.get_pipes(0, 19)
            }
            socket.emit('register-success-response', return_package);
        } else {
            socket.emit('register-failure-response', null);
        }
    });

    socket.on('jump-request', function (data) {
        game_module.jump(data);
    });

    socket.on('clients-request', function () {
        socket.emit('client-response', client_module.all);
    });

    socket.on('pipes-request', function (data) {
        socket.emit('pipes-response', pipe_module.get_pipes(data, data + 19));
    });

    socket.on('update-state-request', function (data) {
        client_module.all[data.client_id].update_state(data.state);
    });

    refresh_client_list_service = setInterval(function () {
        io.sockets.emit('client-list-response', client_module.all);
    }, 3000);

    refresh_client_temp_service = setInterval(function () {
        io.sockets.emit('clients-game-response', client_module.playing);
    }, 50);
});

game_loop_service = setInterval(game_module.game_loop, 50);