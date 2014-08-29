var View = (function () {
    var PLAYING_COLOR = "#15CF00";
    var IDLE_COLOR = "#ABABAB";
    var SPECTATING_COLOR = "#FFFFFF";

    var $loading_input_username;
    var $loading_connecting_message;
    var $loading_input_username_invalid;

    var $game_menu_dialog;

    var $back_button;

    var $client_list;
    var $client_count;
    var cloneable_node;

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

    function update_connected_clients_list (clients) {
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

            client_node_jquery.find(".client-name").html(client.username);
            $client_list.append(client_node_jquery);
        }
    }

    function update_connected_clients_count (count) {
        $client_count.html(count);
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

            Network.on.client_list_returned(function (data) {
                update_connected_clients_count(Object.keys(data).length);
                update_connected_clients_list(data);
            });
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

        remove_game_menu_dialog_and_loading_blocker : function () {
            $("#loading-blocker").fadeOut("fast");
            $("#game-menu-dialogs").fadeOut("fast");
            $back_button.show();
        },

        begin_registration : function (show_error_message) {
            $loading_connecting_message.hide();
            $loading_input_username.show();

            if (show_error_message === true) $loading_input_username_invalid.show();

            enable_character_username_submission();
        },

        update_connected_clients_count : update_connected_clients_count,

        update_connected_clients_list : update_connected_clients_list,
    }
})();