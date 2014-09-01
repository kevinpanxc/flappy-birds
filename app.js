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
var game_loop_service;
var state_clean_up_service;
var refresh_client_list_service;
var refresh_client_temp_service;

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

    socket.on('clients-request', function () {
        socket.emit('client-response', client_module.all);
    });

    socket.on('pipes-request', function (data) {
        socket.emit('pipes-response', pipe_module.get_pipes(data, data + 19));
    });

    socket.on('update-game-state-request', function (data) {
        if (!client_module.all[data.client_id]) {
            socket.emit('reset-game-response');
            return;
        }
        client_module.all[data.client_id].update_state(data.state);
    });

    socket.on('update-score-request', function (data) {
        if (!client_module.all[data.client_id]) {
            socket.emit('reset-game-response');
            return;
        }
        client_module.all[data.client_id].score = data.score;
        io.sockets.emit('update-score-response', { client_id : data.client_id, score : data.score });
    });

    socket.on('update-bird-state-request', function (data) {
        if (!client_module.all[data.client_id]) {
            socket.emit('reset-game-response');
            return;
        }
        var client = client_module.all[data.client_id];
        client.y = data.y;
        client.y_velocity = data.y_velocity;
        client.dead = data.dead;
        client.state_timestamp = new Date().getTime();
    });

    socket.on('refresh-state-timestamp', function (data) {
        if (!client_module.all[data.client_id]) {
            socket.emit('reset-game-response');
            return;
        }
        client_module.all[data.client_id].state_timestamp = new Date().getTime();
    });

    socket.on('inc-pipe-counter-request', function (data) {
        var pipe = pipe_module.get_pipe(data);
        if (pipe) pipe.death_counter++;
    });

    socket.on('pipes-death-counter-request', function (data) {
        socket.emit('pipes-death-counter-response', { pipes : pipe_module.get_pipes(data.start_index, data.end_index), start_index : data.start_index });
    });

    socket.on('sync-request', function (data) {
        if (!client_module.all[data.client_id]) {
            socket.emit('reset-game-response');
            return;
        }
        var client = client_module.all[data.client_id];
        socket.emit('sync-response', { request_id : data.request_id, x : client.x, y : client.y, y_velocity : client.y_velocity });
    });

    refresh_client_list_service = setInterval(function () {
        io.sockets.emit('client-list-response', client_module.all);
    }, 5000);

    refresh_client_temp_service = setInterval(function () {
        io.sockets.emit('clients-game-response', client_module.playing);
    }, 100);
});

game_loop_service = setInterval(game_module.game_loop, 33);
state_clean_up_service = setInterval(client_module.scan_states, 4000);