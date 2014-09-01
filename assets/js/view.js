var View = (function () {
    var PLAYING_COLOR = "#15CF00";
    var IDLE_COLOR = "#ABABAB";
    var SPECTATING_COLOR = "#FFFFFF";

    var $loading_input_username;
    var $loading_connecting_message;
    var $loading_input_username_invalid;

    var $spectator_controls;

    var $game_menu_dialog;

    var $back_button;

    var $client_list;
    var $client_count;
    var cloneable_node;

    var $splash;
    var $scoreboard;
    var $medal;
    var $curret_score;
    var $high_score;
    var $reply_button;

    var $big_score;

    function show_connecting_message () {
        $loading_connecting_message.show();
        $loading_input_username.hide();
    }

    function enable_character_username_submission () {
        document.onkeydown = function (event) {
            var e = e || window.event;

            if (e.keyCode === 13) {
                var username = $("#loading-input-username input").val();
                Network.send.register(username);
                $loading_input_username_invalid.hide();
                disable_character_username_submission();
                show_connecting_message();
            }
        }
    }

    function disable_character_username_submission () {
        document.onkeydown = function () {}
    }

    function initialize_cloneable_node () {
        var parent = document.createElement("li");
        var client_color = document.createElement("div");
        client_color.className = "client-color";

        var client_text = document.createElement("div");
        client_text.className = "client-text";

        var client_id = document.createElement("div");
        client_id.className = "client-name";

        var client_status_and_score_parent = document.createElement("div");
        client_status_and_score_parent.className = "client-status-and-score-parent";

        var client_status = document.createElement("div");
        client_status.className = "client-status";

        var client_score = document.createElement("div");
        client_score.className = "client-score";

        client_status_and_score_parent.appendChild(client_status);
        client_status_and_score_parent.appendChild(client_score);

        client_text.appendChild(client_id);
        client_text.appendChild(client_status_and_score_parent);

        parent.appendChild(client_color);
        parent.appendChild(client_text);

        return parent;
    }

    function update_connected_clients_list (id, clients) {
        var clients_array = $.map(clients, function (value, key) { return value });

        clients_array.sort(function (a,b) { return b.state - a.state });

        $client_list.empty();

        for (var i = 0; i < clients_array.length; i++) {
            var client = clients_array[i];
            var client_node_jquery = $(cloneable_node.cloneNode(true));

            if (client.state === 0) {
                client_node_jquery.find(".client-color").css( "background-color", IDLE_COLOR );
                client_node_jquery.find(".client-status").html("Idle");
            } else if (client.state === 1) {
                client_node_jquery.find(".client-color").css( "background-color", PLAYING_COLOR );
                client_node_jquery.find(".client-status").html("Playing");

                client_node_jquery.find(".client-score").html(client.score);
                client_node_jquery.find(".client-score").attr("id", "score-" + client.id);
            } else if (client.state === 2) {
                client_node_jquery.find(".client-color").css( "background-color", SPECTATING_COLOR );
                client_node_jquery.find(".client-status").html("Spectating");
            }

            if (client.id == id) {
                client_node_jquery.find(".client-name").html(client.username);
                client_node_jquery.find(".client-name").css("font-size", "26px");
                client_node_jquery.css("height", "72px");
                client_node_jquery.find(".client-color").css("height", "72px");
                $client_list.prepend(client_node_jquery);
            } else {
                client_node_jquery.find(".client-name").html(client.username);
                $client_list.append(client_node_jquery);
            }
        }
    }

    function update_connected_clients_count (count) {
        $client_count.html(count);
    }

    function display_end_game_score_board () {
        if ($scoreboard.css('display') == 'none') {
            hide_big_score();
            $back_button.hide();
            $scoreboard.show();
            $scoreboard.css({ top: '104px', opacity: 0 });
            $replay.css({ top: '245px', opacity: 0 });
            $scoreboard.animate({ top: '64px', opacity: 1 }, 600, 'swing', function () {
                $replay.animate({ top: '205px', opacity: 1 }, 600, 'swing');
            });
        }
    }

    function hide_score_board (still_in_game, callback) {
        if (still_in_game) {
            $scoreboard.animate({ top: '104px', opacity: 0 }, 600, 'swing', function () {
                $scoreboard.hide();
                callback();
                $back_button.show();
            });            
        } else {
            $scoreboard.hide();
        }
    }

    function display_big_score (score) {
        hide_big_score();
        score = score.toString();
        for (var i = 0; i < score.length; i++)
            $big_score.append("<img src='images/font_big_" + score.charAt(i) + ".png' alt='" + score.charAt(i) + "'>");
    }

    function hide_big_score () {
        $big_score.empty();
    }

    return {
        initialize : function () {
            $loading_input_username = $("#loading-input-username");
            $loading_connecting_message = $("#loading-message");
            $loading_input_username_invalid = $("#loading-input-username-invalid");
            $game_menu_dialog = $("#game-menu-dialogs");
            $client_list = $("#client-screen ul");
            $client_count = $("#client-count span");
            $back_button = $("#back-button");
            cloneable_node = initialize_cloneable_node();
            $scoreboard = $("#scoreboard");
            $medal = $("#medal");
            $current_score = $("#current-score");
            $high_score = $("#high-score");
            $replay = $("#replay");
            $big_score = $("#big-score");
            $splash = $("#splash");
            $spectator_controls = $("#spectator-controls");
        },

        remove_loading_dialog : function () {
            $loading_connecting_message.hide();
            $loading_input_username.hide();
            $(".loading").fadeOut("fast");            
        },

        display_game_menu : function () {
            $back_button.hide();
            $game_menu_dialog.show();
        },

        hide_game_menu : function () {
            $game_menu_dialog.hide();
        },

        remove_game_menu_dialog_and_loading_blocker : function () {
            $("#loading-blocker").fadeOut("fast");
            $("#game-menu-dialogs").fadeOut("fast");
            $back_button.show();
        },

        begin_registration : function (show_error_message) {
            $(".loading").show();
            $loading_connecting_message.hide();
            $loading_input_username.show();
            if (show_error_message === true) $loading_input_username_invalid.show();
            enable_character_username_submission();
        },

        update_connected_clients_count : update_connected_clients_count,

        update_connected_clients_list : update_connected_clients_list,

        display_end_game_score_board : display_end_game_score_board,

        hide_score_board : hide_score_board,

        display_big_score : display_big_score,

        hide_big_score : hide_big_score,

        display_spectator_controls : function () { $spectator_controls.show(); },

        hide_spectator_controls : function () { $spectator_controls.hide(); },

        display_splash : function () { $splash.show(); },

        hide_splash : function () { $splash.hide(); },

        update_score_of_player : function (id, score) {
            $("#score-" + id).html(score);
        },

        hide_back_button : function () { $back_button.hide() }
    }
})();