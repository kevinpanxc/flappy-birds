function binary_index_of_next_largest (array, element) {
    var min_index = 0;
    var max_index = array.length - 1;
    var current_index;
    var current_element;
 
    while (min_index <= max_index) {
        current_index = (min_index + max_index) / 2 | 0;
        current_element = array[current_index];
 
        if (current_element < element) {
            min_index = current_index + 1;
        }
        else if (current_element > element) {
            max_index = current_index - 1;
        }
        else {
            return current_index;
        }
    }
 
    return min_index;
}

var ImageRepo = new function () {
    this.background_sky = new Image(); 
    this.background_sky.src = "images/sky.png";

    this.background_land = new Image();
    this.background_land.src = "images/land.png";

    this.background_ceiling = new Image();
    this.background_ceiling.src = "images/ceiling.png";

    this.pipe_up = new Image();
    this.pipe_up.src = "images/pipe-up.png";

    this.pipe_down = new Image();
    this.pipe_down.src = "images/pipe-down.png";

    this.pipe = new Image();
    this.pipe.src = "images/pipe.png";

    this.pipe_long = new Image();
    this.pipe_long.src = "images/long_pipe.png";

    this.bird = new Image();
    this.bird.src = "images/bird.png";
}

var Birds = (function () {
    var canvas;
    var context;
    var canvas_width;
    var canvas_height;

    var all = {};

    var loop_time_stamp = null;
    var accrued_time = 0;

    var gravity = 0.7; // 1 unit per 100 ms
    var jump = -6;

    function draw_single_bird (x, y, primary) {
        if (!primary) context.globalAlpha = 0.7;
        context.drawImage(ImageRepo.bird, 0, 0, 34, 24, x, y, 34, 24);
        context.globalAlpha = 1.0;
    }

    return {
        initialize : function () {
            canvas = document.getElementById('birds-canvas');
            context = canvas.getContext('2d');
            canvas_width = canvas.width;
            canvas_height = canvas.height;
        },

        draw_bird_frame : function (map_position) {
            context.clearRect(0, 0, canvas_width, canvas_height);
            for (var client_id in all) {
                var client = all[client_id];
                if (client.x < map_position || client.x > map_position + 400 ) continue;
                var canvas_x = ( client.x - map_position ) * Game.CANVAS_X_TO_MAP_POSITION_SCALE;
                var canvas_y = client.y;
                draw_single_bird (canvas_x, canvas_y, Game.get_client_id() == client_id);
            }
        },

        get_new_map_position_based_on_current_player_position : function () {
            return all[Game.get_client_id()].x - 27;
        },

        on_click_start_run : function () {
            canvas.onclick = Game.start_run;
        },

        on_click_jump : function () {
            canvas.onclick = function () {
                all[Game.get_client_id()].y_velocity = jump;
                Game.add_to_jump_history();
                Network.send.jump(Game.get_client_id());
            }
        },

        refresh_birds : function (birds) {
            all = birds;
        },

        clear : function () {
            context.clearRect(0, 0, canvas_width, canvas_height);
        },

        initialize_client_bird : function () {
            all[Game.get_client_id()] = {
                y : 180,
                x : 27,
                y_velocity : 0
            }
        },

        update_bird_attributes : function (client_id, x) {
            all[client_id].x = x;
        },

        synch_with_server : function ( client_id, data, time_stamp_of_data, jump_history ) {
            var current_time_stamp = new Date().getTime();
            all[client_id].x = data.x + (current_time_stamp - time_stamp_of_data) / 20;
            all[client_id].y = data.y;
            all[client_id].y_velocity = data.y_velocity;

            var delta_t;

            if (jump_history.length == 0) {
                delta_t = current_time_stamp - time_stamp_of_data;
                all[client_id].y_velocity += ( delta_t / 100 ) * gravity;
                all[client_id].y += all[client_id].y_velocity;
                return;
            }

            for ( var i = 0; i < jump_history.length + 1; i++ ) { // resynchronize
                var delta_t;
                if ( i == jump_history.length ) delta_t = current_time_stamp - jump_history[i - 1];
                else if (i == 0) delta_t = jump_history[i] - time_stamp_of_data;
                else delta_t = jump_history[i] - jump_history[i - 1];

                all[client_id].y_velocity += ( delta_t / 100 ) * gravity;
                all[client_id].y += all[client_id].y_velocity;
                all[client_id].y_velocity = jump;
            }
        },

        client_prediction_update : function (time_stamp) {
            if (loop_time_stamp == null) loop_time_stamp = time_stamp;
            var delta_t = time_stamp - loop_time_stamp;
            loop_time_stamp = time_stamp;
            if (!isNaN(delta_t)) {
                accrued_time += delta_t;
                while (accrued_time >= 33) {
                    all[Game.get_client_id()].y_velocity += gravity;
                    all[Game.get_client_id()].y += all[Game.get_client_id()].y_velocity;
                    if ( all[Game.get_client_id()].y > ( canvas_height - 24 ) ) {
                        all[Game.get_client_id()].y_velocity = 0;
                        all[Game.get_client_id()].y = canvas_height - 24;
                    }
                    accrued_time -= 33;
                }
            }
        }
    }
})();

var Pipes = (function () {
    var canvas;
    var context;
    var canvas_width;
    var canvas_height;

    var pipe_width = 52;
    var pipe_head_height = 26;

    var all = [];

    var first_pipe_position = 450;
    var distance_between_pipes = 86; // start of one pipe to start of next pipe

    var pipe_request_sent = false;

    function draw_single_pipe (x, top_height, bottom_height, i) {
        context.drawImage(ImageRepo.pipe_down, x, top_height - pipe_head_height);
        context.drawImage(ImageRepo.pipe_long, x, 0, pipe_width, top_height - pipe_head_height);
        var bottom_pipe_height = top_height + 90 + pipe_head_height;
        context.drawImage(ImageRepo.pipe_up, x, top_height + 90);
        context.drawImage(ImageRepo.pipe_long, x, bottom_pipe_height, pipe_width, canvas_height - bottom_pipe_height);
    }

    function add_pipes (pipes) {
        all = all.concat(pipes);
    }

    return {
        initialize : function () {
            canvas = document.getElementById('pipe-canvas');
            context = canvas.getContext('2d');
            canvas_width = canvas.width;
            canvas_height = canvas.height;

            Network.on.pipes_returned(function (data) {
                pipe_request_sent = false;
                add_pipes(data);
            });
        },

        draw_pipe_frame : function (map_position) {
            context.clearRect(0, 0, canvas_width, canvas_height);
            var first_pipe_to_draw_index = Math.floor(( map_position - first_pipe_position ) / distance_between_pipes );
            if (first_pipe_to_draw_index < 0) first_pipe_to_draw_index = 0;

            if (!pipe_request_sent && first_pipe_to_draw_index >= all.length - 10) {
                pipe_request_sent = true;
                Network.send.new_pipes(all.length);
            }

            for (var i = first_pipe_to_draw_index; i < first_pipe_to_draw_index + 6; i++) {
                var actual_position_of_pipe = first_pipe_position + (i * distance_between_pipes);
                var x = (actual_position_of_pipe - map_position) * Game.CANVAS_X_TO_MAP_POSITION_SCALE;

                draw_single_pipe(x, all[i].top_height, all[i].bottom_height, i);
            }
        },

        add_pipes : add_pipes,

        current_pipe_count : function () {
            return all.length;
        },

        clear : function () {
            context.clearRect(0, 0, canvas_width, canvas_height);
        }
    }
})();

var Background = (function () {
    var canvas;
    var context;
    var canvas_width;
    var canvas_height;

    var sec_x = 0;
    var sec_y;

    var prime_x = 0;
    var sky_y;
    var ceiling_y;

    var sec_bg_speed = 0.7;

    var loop_time_stamp = null;

    return {
        initialize : function () {
            canvas = document.getElementById('bg-canvas');
            context = canvas.getContext('2d');
            canvas_width = canvas.width;
            canvas_height = canvas.height;

            sky_y = canvas_height - ImageRepo.background_land.height;
            sec_y = sky_y - ImageRepo.background_sky.height;

            ceiling_y = 0;
        },

        draw : function () {
            context.fillStyle = "#4ec0ca";
            context.fillRect(0, 0, canvas_width, canvas_height);
            context.drawImage(ImageRepo.background_sky, 0, sec_y);
            context.drawImage(ImageRepo.background_land, 0, sky_y);
            context.drawImage(ImageRepo.background_ceiling, 0, ceiling_y);
        },

        pan_right : function (map_position_increment) {
            if (sec_x < 0) sec_x = sec_x + ImageRepo.background_sky.width;
            if (prime_x < 0) prime_x = prime_x + ImageRepo.background_sky.width;
            sec_x += sec_bg_speed;
            prime_x += Game.CANVAS_X_TO_MAP_POSITION_SCALE * map_position_increment;
            context.drawImage(ImageRepo.background_sky, sec_x, sec_y);
            context.drawImage(ImageRepo.background_sky, sec_x - ImageRepo.background_sky.width, sec_y);

            context.drawImage(ImageRepo.background_land, prime_x, sky_y);
            context.drawImage(ImageRepo.background_land, prime_x - ImageRepo.background_land.width, sky_y);

            context.drawImage(ImageRepo.background_ceiling, prime_x, ceiling_y);
            context.drawImage(ImageRepo.background_ceiling, prime_x - ImageRepo.background_ceiling.width, ceiling_y);

            if (sec_x >= canvas_width) sec_x = 0;
            if (prime_x >= canvas_width) prime_x = 0;
        },

        pan_left : function (map_position_increment) {
            if (sec_x > 0) sec_x = sec_x - ImageRepo.background_sky.width;
            if (prime_x > 0) prime_x = prime_x - ImageRepo.background_sky.width;
            sec_x -= sec_bg_speed;
            prime_x -= Game.CANVAS_X_TO_MAP_POSITION_SCALE * map_position_increment;
            context.drawImage(ImageRepo.background_sky, sec_x, sec_y);
            context.drawImage(ImageRepo.background_sky, sec_x + ImageRepo.background_sky.width, sec_y);

            context.drawImage(ImageRepo.background_land, prime_x, sky_y);
            context.drawImage(ImageRepo.background_land, prime_x + ImageRepo.background_land.width, sky_y);

            context.drawImage(ImageRepo.background_ceiling, prime_x, ceiling_y);
            context.drawImage(ImageRepo.background_ceiling, prime_x + ImageRepo.background_ceiling.width, ceiling_y);

            if (sec_x <= -canvas_width) sec_x = 0;
            if (prime_x <= -canvas_width) prime_x = 0;
        },

        clear : function () {
            context.clearRect(0, 0, canvas_width, canvas_height);
        },

        get_map_position_increment : function (time_stamp) {
            if (loop_time_stamp == null) loop_time_stamp = time_stamp;
            var map_position_increment = (time_stamp - loop_time_stamp) / 20;
            loop_time_stamp = time_stamp;
            return map_position_increment;
        },

        reset_time_stamp : function () {
            loop_time_stamp = null;
        }
    }
})();

var Game = (function () {
    var STATES = Object.freeze({
        IDLE: 0,
        PLAYING: 1,
        SPECTATING: 2
    });

    var background_loop_id;
    var pipe_loop_id;
    var bird_loop_id;
    var pan_right_button;
    var pan_left_button;
    var map_position = 0.0;
    var id;
    var state = STATES.IDLE;

    var jump_history = [];
    var client_requests = [];
    var current_request_id = -1;

    function client_game_loop () {
        client_requests.push({ position : map_position + 27, time_stamp : new Date().getTime() });
        Network.send.request_state({ client_id : id, request_id : client_requests.length - 1 });
    }

    function animate_background_left (time_stamp) {
        if (map_position <= 0) return;
        background_loop_id = window.requestAnimationFrame ( animate_background_left );
        var map_position_increment = Background.get_map_position_increment(time_stamp);
        if (!isNaN(map_position_increment)) {
            Background.pan_right(map_position_increment);
            map_position -= map_position_increment;
        }
        if (map_position < 0) map_position = 0;
    }

    function animate_background_right (time_stamp) {
        background_loop_id = window.requestAnimationFrame ( animate_background_right );
        var map_position_increment = Background.get_map_position_increment(time_stamp);
        if (!isNaN(map_position_increment)) {
            Background.pan_left(map_position_increment);
            map_position += map_position_increment;
            if (state == STATES.PLAYING) Birds.update_bird_attributes ( id, map_position + 27 );
        }
    }

    function animate_pipes () {
        pipe_loop_id = window.requestAnimationFrame ( animate_pipes );
        Pipes.draw_pipe_frame(map_position);
    }

    function animate_birds (time_stamp) {
        bird_loop_id = window.requestAnimationFrame ( animate_birds );
        if (state == STATES.PLAYING) Birds.client_prediction_update(time_stamp);
        map_position = Birds.get_new_map_position_based_on_current_player_position();
        Birds.draw_bird_frame(map_position);
    }

    function stop_bird_animation () {
        window.cancelAnimationFrame(bird_loop_id);
        bird_loop_id = -1;
    }

    function move_left () {
        stop_background();
        animate_background_left ();
        animate_pipes ();
    }

    function move_right () {
        stop_background();
        animate_background_right ();
        animate_pipes ();
    }

    function stop_background () {
        window.cancelAnimationFrame(background_loop_id);
        window.cancelAnimationFrame(pipe_loop_id);
        background_loop_id = -1;
        pipe_loop_id = -1;
        Background.reset_time_stamp();
    }

    function setup_panning_buttons () {
        pan_right_button.onmousedown = move_right;
        pan_left_button.onmousedown = move_left;
        pan_right_button.onmouseup = stop_background;
        pan_left_button.onmouseup = stop_background;
        pan_right_button.onmouseout = stop_background;
        pan_left_button.onmouseout = stop_background;        
    }

    function display_spectator_controls () {
        $("#spectator-controls").show();
    }

    function hide_spectator_controls () {
        $("#spectator-controls").hide();
    }

    function display_splash () {
        $("#splash").show();
    }

    function hide_splash () {
        $("#splash").hide();
    }

    return {
        initialize : function () {
            pan_right_button = document.getElementById('pan_right_button');
            pan_left_button = document.getElementById('pan_left_button');
            
            setup_panning_buttons()

            Background.initialize();
            Birds.initialize();
            Pipes.initialize();

            Background.draw();

            Network.on.register_success(function (data) {
                id = data.client_id;
                Birds.initialize_client_bird();
                Pipes.add_pipes(data.pipes); // add first twenty pipes to Pipes manager
                View.update_connected_clients_count(Object.keys(data.clients).length);
                View.update_connected_clients_list(data.clients);
                View.remove_loading_dialog();
                View.display_game_menu();
            });

            Network.on.register_failure(function(data) {
                View.begin_registration(true);
            });

            View.begin_registration(false);
        },

        spectate : function () {
            map_position = 0;
            View.remove_game_menu_dialog_and_loading_blocker();
            display_spectator_controls();
            Network.send.update_state({client_id: id, state: 'SPECTATING'});
        },

        play : function () {
            map_position = 0;
            View.remove_game_menu_dialog_and_loading_blocker();
            // Network.on.client_list_returned_for_game(function (data) {
            //     Birds.refresh_birds(data);
            // });
            Network.on.response_state(function (data) {
                if (data.request_id < current_request_id) return;
                client_requests[data.request_id].position = data.position;
                current_request_id = data.request_id;

                var index_of_next_jump_time = binary_index_of_next_largest ( jump_history, client_requests[data.request_id].time_stamp );
                jump_history.splice( 0, index_of_next_jump_time );

                Birds.synch_with_server ( id, data, client_requests[data.request_id].time_stamp, jump_history );
            });
            Birds.on_click_start_run();
            display_splash();
            animate_birds();
        },

        start_run : function () {
            state = STATES.PLAYING;
            Network.send.update_state({client_id: Game.get_client_id(), state: "PLAYING"});
            hide_splash();
            move_right();
            Birds.on_click_jump();

            setInterval(client_game_loop, 200);
        },

        get_client_id : function () {
            return id;
        },

        back_to_game_menu : function () {
            state = STATES.IDLE;
            View.display_game_menu();
            Network.send.update_state({client_id: id, state: 'IDLE'});
            Birds.clear();
            Pipes.clear();
            stop_bird_animation();
            stop_background();
            hide_spectator_controls();
            hide_splash();
            client_requests = [];
            Network.remove.client_list_returned_for_game();
        },

        add_to_jump_history : function () {
            jump_history.push( new Date().getTime() );
        },

        CANVAS_X_TO_MAP_POSITION_SCALE : 2.2
    }
})();