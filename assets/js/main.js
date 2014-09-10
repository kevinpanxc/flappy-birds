function OtherPlayer ( x, y ) {
    this.x = null;
    this.y = null;
    this.has_info = false;
    this.paused = false;
    this.goal_time_stamp = null;
    this.current_time_stamp = null;
    this.increment_x = null;
    this.increment_y = null;
    this.next_index = null;

    this.states = [ {
        x : x,
        y : y,
        time_stamp : new Date().getTime()
    } ];
}

OtherPlayer.prototype.push_state = function (x, y) {
    this.has_info = true;

    this.states.push({
        x : x,
        y : y,
        time_stamp : new Date().getTime()
    });
}

OtherPlayer.prototype.trim_data = function () {
    if (this.states.length > 15) {
        var number_of_removed_elements = this.states.length - 5;
        this.states.splice(0, number_of_removed_elements);
        this.next_index -= number_of_removed_elements;
    }
}

OtherPlayer.prototype.set_new_increments = function () {
    var s1 = this.states[this.next_index - 1];
    var s2 = this.states[this.next_index];

    this.goal_time_stamp += s2.time_stamp - s1.time_stamp;
    this.x_increment = ( s2.x - s1.x ) / ((s2.time_stamp - s1.time_stamp) / 33); 
    this.y_increment = ( s2.y - s1.y ) / ((s2.time_stamp - s1.time_stamp) / 33);      
}

OtherPlayer.prototype.advance = function () {
    if (this.has_info) {
        if (this.current_time_stamp == null) {
            var s1 = this.states[0];
            var s2 = this.states[1];

            this.next_index = 1;
            this.current_time_stamp = new Date().getTime();
            this.goal_time_stamp = s2.time_stamp - s1.time_stamp + this.current_time_stamp;
            this.x_increment = ( s2.x - s1.x ) / ((s2.time_stamp - s1.time_stamp) / 33); 
            this.y_increment = ( s2.y - s1.y ) / ((s2.time_stamp - s1.time_stamp) / 33);

            this.x = s1.x;
            this.y = s1.y;
        } else if (this.paused) {
            this.paused = false;
            this.set_new_increments();           
        } else {
            this.x += this.x_increment;
            this.y += this.y_increment;
            this.current_time_stamp += 33;

            if (this.current_time_stamp >= this.goal_time_stamp) {
                this.x = this.states[this.next_index].x;
                this.y = this.states[this.next_index].y;
                this.trim_data();
                this.next_index++;
                if (this.next_index >= this.states.length) {
                    this.paused = true;
                    this.has_info = false;
                } else this.set_new_increments();
            }
        }
    }
}

OtherPlayer.prototype.is_drawable = function () {
    return this.current_time_stamp != null;
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
    var main_player;
    var other_players = {};
    var loop_time_stamp_1 = null;
    var loop_time_stamp_2 = null;
    var accrued_time_1 = 0;
    var accrued_time_2 = 0;

    var gravity = 0.5;
    var jump = -6;

    function draw_single_bird (x, y, primary) {
        if (!primary) context.globalAlpha = 0.7;
        context.drawImage(ImageRepo.bird, 0, 0, 34, 24, x, y, 34, 24);
        context.globalAlpha = 1.0;
    }

    function is_on_ground () {
        return main_player.y >= canvas_height - 24;
    }

    return {
        initialize : function () {
            canvas = document.getElementById('birds-canvas');
            context = canvas.getContext('2d');
            canvas_width = canvas.width;
            canvas_height = canvas.height;
        },

        draw_bird_frame : function (map_position, draw_main_bird) {
            context.clearRect(0, 0, canvas_width, canvas_height);
            if (draw_main_bird) {
                var canvas_x = ( main_player.x - map_position ) * Game.CANVAS_X_TO_MAP_POSITION_SCALE;
                var canvas_y = main_player.y;
                draw_single_bird (canvas_x, canvas_y, true);
            }
            for (var client_id in other_players) {
                if (client_id == Game.get_client_id()) continue;
                var client = other_players[client_id];
                if (!client.is_drawable() || client.x < map_position - 40 || client.x > map_position + 400 ) continue;
                var canvas_x = ( client.x - map_position ) * Game.CANVAS_X_TO_MAP_POSITION_SCALE;
                if (isNaN(client.y)) console.log("huh?");
                var canvas_y = client.y;
                draw_single_bird (canvas_x, canvas_y, false);
            }
        },

        main : {
            initialize : function (client_id) {
                main_player = {
                    id : client_id,
                    y : 180,
                    x : 27,
                    score : 0,
                    y_velocity : jump,
                    going_through_pipe : false,
                    dead : false
                }
            },

            get_new_map_position_based_on_current_position : function () {
                return main_player.x - 27;
            },

            get : function () {
                return main_player;
            },

            sync_x_with_server : function ( x, time_stamp_of_data ) {
                var current_time_stamp = new Date().getTime();
                main_player.x = x + (current_time_stamp - time_stamp_of_data) / 20;
            },

            update_y_position : function (time_stamp) {
                if (loop_time_stamp_1 == null) loop_time_stamp_1 = time_stamp;
                var delta_t = time_stamp - loop_time_stamp_1;
                loop_time_stamp_1 = time_stamp;
                if (!isNaN(delta_t)) {
                    accrued_time_1 += delta_t;
                    while (accrued_time_1 >= 33) {
                        main_player.y_velocity += gravity;
                        main_player.y += main_player.y_velocity;
                        if ( main_player.y > ( canvas_height - 24 ) ) {
                            main_player.y_velocity = 0;
                            main_player.y = canvas_height - 24;
                        } else if ( main_player.y < 0 ) {
                            main_player.y_velocity = 0;
                            main_player.y = 0;
                        }
                        accrued_time_1 -= 33;
                    }
                }
            },

            still_alive : function (pipe) {
                if (is_on_ground()) {
                    main_player.dead = true;
                    return false;
                }
                if (pipe == false) {
                    if (main_player.going_through_pipe) {
                        View.display_big_score(++main_player.score);
                        main_player.going_through_pipe = false;
                        Network.send.update_score({ client_id : main_player.id, score: main_player.score });
                    }
                    return true;
                } else if (main_player.y <= pipe.top_height || main_player.y + 24 >= pipe.top_height + 90) {
                    main_player.dead = true;
                    return false;
                } else {
                    main_player.going_through_pipe = true;
                }

                return true;
            },

            is_on_ground : is_on_ground
        },

        on_click_start_run : function () {
            canvas.onclick = Game.start_run;
        },

        on_click_jump : function () {
            canvas.onclick = function () {
                main_player.y_velocity = jump;
                main_player.y += main_player.y_velocity;
            }
        },

        on_click_clear : function () {
            canvas.onclick = function () {};
        },

        refresh_birds : function (birds) {
            var temp = {};
            for (var client_id in birds) {
                if (client_id == Game.get_client_id()) continue;
                else if (client_id in other_players) {
                    other_players[client_id].push_state(birds[client_id].x, birds[client_id].y);
                    temp[client_id] = other_players[client_id];
                } else {
                    temp[client_id] = new OtherPlayer(birds[client_id].x, birds[client_id].y);
                }
            }
            other_players = temp;
        },

        update_position_of_other_birds : function (time_stamp) {
            if (loop_time_stamp_2 == null) loop_time_stamp_2 = time_stamp;
            var delta_t = time_stamp - loop_time_stamp_2;
            loop_time_stamp_2 = time_stamp;
            if (!isNaN(delta_t)) {
                accrued_time_2 += delta_t;
                while (accrued_time_2 >= 33) {
                    for (var client_id in other_players) {
                        if (client_id == Game.get_client_id()) continue;
                        other_players[client_id].advance();
                    }
                    accrued_time_2 -= 33;
                }
            }               
        },

        clear : function () {
            other_players = {};
            context.clearRect(0, 0, canvas_width, canvas_height);
        },

        reset_time_stamp : function () {
            loop_time_stamp_1 = null;
            loop_time_stamp_2 = null;
            accrued_time_1 = 0;
            accrued_time_2 = 0;
        }
    }
})();

var Pipes = (function () {
    var canvas;
    var context;
    var canvas_width;
    var canvas_height;

    var pipe_width = 52; // in canvas pixels
    var pipe_head_height = 26;

    var all = [];

    var first_pipe_position = 450; // map position units
    var distance_between_pipes = 86; // start of one pipe to start of next pipe in map position units

    var pipe_request_sent = false;

    function draw_single_pipe (x, pipe) {
        context.drawImage(ImageRepo.pipe_down, x, pipe.top_height - pipe_head_height);
        context.drawImage(ImageRepo.pipe_long, x, 0, pipe_width, pipe.top_height - pipe_head_height);
        var bottom_pipe_height = pipe.top_height + 90 + pipe_head_height;
        context.drawImage(ImageRepo.pipe_up, x, pipe.top_height + 90);
        context.drawImage(ImageRepo.pipe_long, x, bottom_pipe_height, pipe_width, canvas_height - bottom_pipe_height);
        context.fillText(pipe.death_counter, x + pipe_width + 2, 18);
    }

    function add_pipes (pipes) {
        all = all.concat(pipes);
    }

    return {
        initialize : function () {
            canvas = document.getElementById('pipes-canvas');
            context = canvas.getContext('2d');
            canvas_width = canvas.width;
            canvas_height = canvas.height;
            context.fillStyle = "white";
            context.font="18px Open Sans";

            Network.on.pipes_returned(function (data) {
                pipe_request_sent = false;
                add_pipes(data);
            });

            Network.on.response_pipes_death_counter(function (data) {
                var start_index = data.start_index;
                for (var i = 0; i < data.pipes.length; i++) {
                    all[start_index++].death_counter = data.pipes[i].death_counter;
                }
            });
        },

        update_display_pipes_death_counters : function (map_position) {
            var first_pipe_to_draw_index = Math.floor(( map_position - first_pipe_position ) / distance_between_pipes );
            if (first_pipe_to_draw_index < 0) first_pipe_to_draw_index = 0;

            Network.send.request_pipes_death_counter( { start_index : first_pipe_to_draw_index, end_index : first_pipe_to_draw_index + 6 } );
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

                draw_single_pipe(x, all[i]);
            }
        },

        add_pipes : add_pipes,

        current_pipe_count : function () {
            return all.length;
        },

        get_possible_colliding_pipe : function (map_position) {
            var left_edge_of_bird = map_position + 27;
            var right_edge_of_bird = left_edge_of_bird + 34 / Game.CANVAS_X_TO_MAP_POSITION_SCALE;
            var left_edge_ignoring_first_pipe_pos = left_edge_of_bird - first_pipe_position;
            var right_edge_ignoring_first_pipe_pos = right_edge_of_bird - first_pipe_position;

            if (right_edge_ignoring_first_pipe_pos < 0) return { pipe : false };
            else if ( (right_edge_ignoring_first_pipe_pos % distance_between_pipes) < (pipe_width / Game.CANVAS_X_TO_MAP_POSITION_SCALE) ) {
                var index = Math.floor(right_edge_ignoring_first_pipe_pos / distance_between_pipes);
                return { pipe : all[index], i : index };
            } else if ( (left_edge_ignoring_first_pipe_pos % distance_between_pipes) < (pipe_width / Game.CANVAS_X_TO_MAP_POSITION_SCALE) ) {
                var index = Math.floor(left_edge_ignoring_first_pipe_pos / distance_between_pipes);
                return { pipe : all[index], i : index };
            }
            return { pipe : false };
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

    var background_loop_id = -1;
    var pipe_loop_id = -1;
    var bird_loop_id = -1;
    var server_sync_loop_id = -1;
    var update_pipe_death_counter_loop_id = -1;
    var refresh_state_timestamp_loop = -1;

    var pan_right_button;
    var pan_left_button;
    var map_position = 0;
    var id = null;
    var state = STATES.IDLE;

    var client_requests = [];
    var current_request_id = -1;

    function server_sync_loop () {
        client_requests.push({ position : map_position + 27, time_stamp : new Date().getTime() });
        Network.send.request_sync_x({ client_id : id, request_id : client_requests.length - 1 });
        Network.send.update_bird_state({ client_id : id, y : Birds.main.get().y, y_velocity : Birds.main.get().y_velocity, dead : Birds.main.get().dead });
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
            if (state == STATES.PLAYING) Birds.main.get().x = map_position + 27;
        }
    }

    function animate_pipes () {
        pipe_loop_id = window.requestAnimationFrame ( animate_pipes );
        Pipes.draw_pipe_frame(map_position);
    }

    function animate_birds (time_stamp) {
        bird_loop_id = window.requestAnimationFrame ( animate_birds );
        if (state == STATES.PLAYING) {
            Birds.main.update_y_position(time_stamp);
            map_position = Birds.main.get_new_map_position_based_on_current_position();
        }
        Birds.update_position_of_other_birds(time_stamp);
        Birds.draw_bird_frame(map_position, state == STATES.PLAYING);
        if (state == STATES.PLAYING) {
            if (!Birds.main.get().dead) {
                var pipe_object = Pipes.get_possible_colliding_pipe(map_position);
                if (!Birds.main.still_alive(pipe_object.pipe)) {
                    Birds.on_click_clear();
                    stop_background();
                    if (pipe_object.pipe) {
                        pipe_object.pipe.death_counter++;
                        Pipes.draw_pipe_frame(map_position); // update pipe death counter immediately
                        Network.send.increment_pipe_death_counter(pipe_object.i);
                    }
                }
            } else if (Birds.main.is_on_ground()) {
                View.display_end_game_score_board();
            }
        }
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

    function reset_from_game_screen (end_game) {
        client_requests = [];
        state = STATES.IDLE;
        map_position = 0;
        Birds.reset_time_stamp();
        // clear loops
        if (end_game) Network.remove.client_list_returned_for_game();
        stop_bird_animation();
        stop_background();
        clearInterval(update_pipe_death_counter_loop_id);
        update_pipe_death_counter_loop_id = -1;
        clearInterval(server_sync_loop_id);
        server_sync_loop_id = -1;
        // clear UI
        Birds.on_click_clear();
        View.hide_big_score();
        View.hide_splash();
        Birds.clear();
        Pipes.clear();
    }

    function reset_from_spectator_screen () {
        state = STATES.IDLE;
        map_position = 0;
        // clear loops
        Network.remove.client_list_returned_for_game();
        clearInterval(update_pipe_death_counter_loop_id);
        update_pipe_death_counter_loop_id = -1; 
        stop_bird_animation();
        // clear UI
        View.hide_spectator_controls();
        Birds.clear();
        Pipes.clear();
    }

    function reset_game () {
        id = null;
        clearInterval(refresh_state_timestamp_loop);
        refresh_state_timestamp_loop = -1;
        if (state == STATES.SPECTATING) reset_from_spectator_screen();
        else reset_from_game_screen(true);
        View.hide_score_board(false);
        View.hide_game_menu();
        View.hide_back_button();
        View.begin_registration();        
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
                Network.on.response_reset_game(reset_game);
                id = data.client_id;
                Birds.main.initialize(id);
                Pipes.add_pipes(data.pipes); // add first twenty pipes to Pipes manager
                View.update_connected_clients_count(Object.keys(data.clients).length);
                View.update_connected_clients_list(id, data.clients);
                View.remove_loading_dialog();
                View.display_game_menu();
                refresh_state_timestamp_loop = setInterval(function () {
                    Network.send.refresh_state_timestamp({ client_id : id });
                }, 4000);
            });

            Network.on.register_failure(function(data) {
                View.begin_registration(true);
            });

            Network.on.client_list_returned(function (data) {
                View.update_connected_clients_count(Object.keys(data).length);
                View.update_connected_clients_list(id, data);
            });

            Network.on.response_update_score(function (data) {
                View.update_score_of_player(data.client_id, data.score);
            });

            View.begin_registration(false);
        },

        spectate : function () {
            state = STATES.SPECTATING;
            map_position = 0;
            View.remove_game_menu_dialog_and_loading_blocker();
            View.display_spectator_controls();
            Network.send.update_game_state({client_id: id, state: 'SPECTATING'});
            Network.on.client_list_returned_for_game(function (data) {
                Birds.refresh_birds(data);
            });
            animate_birds();
            update_pipe_death_counter_loop_id = setInterval(function () {
                Pipes.update_display_pipes_death_counters(map_position);
                Pipes.draw_pipe_frame(map_position);
            }, 1000);
        },

        play : function () {
            map_position = 0;
            Birds.main.initialize(id);
            View.remove_game_menu_dialog_and_loading_blocker();
            Network.on.client_list_returned_for_game(function (data) {
                Birds.refresh_birds(data);
            });
            Network.on.response_sync_x(function (data) {
                if (data.request_id <= current_request_id) return;
                current_request_id = data.request_id;
                Birds.main.sync_x_with_server ( data.x, client_requests[data.request_id].time_stamp );
            });
            Birds.on_click_start_run();
            View.display_splash();
            animate_birds();
        },

        start_run : function () {
            state = STATES.PLAYING;
            Network.send.update_game_state({client_id: id, state: "PLAYING"});
            View.hide_splash();
            move_right();
            Birds.on_click_jump();
            server_sync_loop_id = setInterval(server_sync_loop, 100);
            update_pipe_death_counter_loop_id = setInterval(function () {
                Pipes.update_display_pipes_death_counters(map_position);
                Pipes.draw_pipe_frame(map_position);
            }, 1000);
            View.display_big_score(Birds.main.get().score);
        },

        get_client_id : function () {
            return id;
        },

        back_to_game_menu : function () {
            if (state == STATES.SPECTATING) reset_from_spectator_screen();
            else reset_from_game_screen(true);
            View.display_game_menu();
            Network.send.update_game_state({client_id: id, state: 'IDLE'});
        },

        back_to_game_start_screen : function () {
            View.hide_score_board(true, function () {
                reset_from_game_screen(false);
                Birds.main.initialize(id);
                Network.send.update_game_state({client_id: id, state: 'IDLE'});
                Birds.on_click_start_run();
                View.display_splash();
                animate_birds();
            });
        },

        reset_game : reset_game,

        CANVAS_X_TO_MAP_POSITION_SCALE : 2.2
    }
})();