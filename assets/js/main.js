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

    function draw_single_bird (x, y, primary) {
        if (!primary) context.globalAlpha = 0.7;
        context.drawImage(ImageRepo.bird, 0, 0, 34, 24, x, y, 34, 24);
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
                if (all[client_id].x < map_position || all[client_id].x > map_position + 400 ) continue;
                var canvas_x = ( all[client_id].x - map_position ) * Game.CANVAS_X_TO_MAP_POSITION_SCALE;
                var canvas_y = all[client_id].y;
                draw_single_bird (canvas_x, canvas_y, Game.get_client_id() == client_id);
            }
        },

        refresh_birds : function (birds) {
            all = birds;
            console.log(Object.keys(all).length);
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

    function draw_single_pipe (x, top_height, bottom_height) {
        context.drawImage(ImageRepo.pipe_down, x, top_height - pipe_head_height);
        context.drawImage(ImageRepo.pipe_long, x, 0, pipe_width, top_height - pipe_head_height);
        var bottom_pipe_height = top_height + 90 + pipe_head_height;
        context.drawImage(ImageRepo.pipe_up, x, top_height + 90);
        context.drawImage(ImageRepo.pipe_long, x, bottom_pipe_height, pipe_width, bottom_pipe_height);
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

                draw_single_pipe(x, all[i].top_height, all[i].bottom_height);
            }
        },

        add_pipes : add_pipes,

        current_pipe_count : function () {
            return all.length;
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

        pan_right : function () {
            if (sec_x < 0) sec_x = sec_x + ImageRepo.background_sky.width;
            if (prime_x < 0) prime_x = prime_x + ImageRepo.background_sky.width;
            sec_x += sec_bg_speed;
            prime_x += Game.CANVAS_X_TO_MAP_POSITION_SCALE;
            context.drawImage(ImageRepo.background_sky, sec_x, sec_y);
            context.drawImage(ImageRepo.background_sky, sec_x - ImageRepo.background_sky.width, sec_y);

            context.drawImage(ImageRepo.background_land, prime_x, sky_y);
            context.drawImage(ImageRepo.background_land, prime_x - ImageRepo.background_land.width, sky_y);

            context.drawImage(ImageRepo.background_ceiling, prime_x, ceiling_y);
            context.drawImage(ImageRepo.background_ceiling, prime_x - ImageRepo.background_ceiling.width, ceiling_y);

            if (sec_x >= canvas_width) sec_x = 0;
            if (prime_x >= canvas_width) prime_x = 0;
        },

        pan_left : function () {
            if (sec_x > 0) sec_x = sec_x - ImageRepo.background_sky.width;
            if (prime_x > 0) prime_x = prime_x - ImageRepo.background_sky.width;
            sec_x -= sec_bg_speed;
            prime_x -= Game.CANVAS_X_TO_MAP_POSITION_SCALE;
            context.drawImage(ImageRepo.background_sky, sec_x, sec_y);
            context.drawImage(ImageRepo.background_sky, sec_x + ImageRepo.background_sky.width, sec_y);

            context.drawImage(ImageRepo.background_land, prime_x, sky_y);
            context.drawImage(ImageRepo.background_land, prime_x + ImageRepo.background_land.width, sky_y);

            context.drawImage(ImageRepo.background_ceiling, prime_x, ceiling_y);
            context.drawImage(ImageRepo.background_ceiling, prime_x + ImageRepo.background_ceiling.width, ceiling_y);

            if (sec_x <= -canvas_width) sec_x = 0;
            if (prime_x <= -canvas_width) prime_x = 0;
        }
    }
})();

var Game = (function () {
    var background_loop_id;
    var pipe_loop_id;
    var bird_loop_id;

    var pan_right_button;
    var pan_left_button;

    var map_position = 0;

    var id;

    function animate_background_left () {
        if (map_position <= 0) {
            map_position = 0;
            return;
        }
        background_loop_id = window.requestAnimationFrame ( animate_background_left );
        Background.pan_right();
        map_position--;
    }

    function animate_background_right () {
        background_loop_id = window.requestAnimationFrame ( animate_background_right );
        Background.pan_left();
        map_position++;     
    }

    function animate_pipes () {
        pipe_loop_id = window.requestAnimationFrame ( animate_pipes );
        Pipes.draw_pipe_frame(map_position);
    }

    function animate_birds () {
        bird_loop_id = window.requestAnimationFrame ( animate_birds );
        Birds.draw_bird_frame(map_position);
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

    function display_splash () {
        $("#splash").show();
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
        },

        play : function () {
            map_position = 0;
            View.remove_game_menu_dialog_and_loading_blocker();
            Network.on.client_list_returned_for_game(function (data) {
                Birds.refresh_birds(data);
            });
            display_splash();
            animate_birds();
        },

        get_client_id : function () {
            return id;
        },

        CANVAS_X_TO_MAP_POSITION_SCALE : 2.2
    }
})();