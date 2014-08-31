var Network = (function () {
    var socket;
    var url = document.URL;

    var REQUEST_REGISTER = 'register-request';
    var REQUEST_NEW_PIPES = 'pipes-request';
    var REQUEST_UPDATE_GAME_STATE = 'update-game-state-request';
    var REQUEST_UPDATE_BIRD_STATE = 'update-bird-state-request';
    var REQUEST_SYNC_X = 'sync-request';
    var REQUEST_UPDATE_SCORE = 'update-score-request';
    var REQUEST_INC_PIPE_COUNTER = 'inc-pipe-counter-request';
    var REQUEST_PIPES_DEATH_COUNTER = 'pipes-death-counter-request';

    var RESPONSE_REGISTER_SUCCESS = 'register-success-response';
    var RESPONSE_REGISTER_FAILURE = 'register-failure-response';
    var RESPONSE_CLIENT_LIST = 'client-list-response';
    var RESPONSE_CLIENTS_FOR_GAME = 'clients-game-response';
    var RESPONSE_NEW_PIPES = 'pipes-response';
    var RESPONSE_SYNC_X = 'sync-response';
    var RESPONSE_UPDATE_SCORE = 'update-score-response';
    var RESPONSE_PIPES_DEATH_COUNTER = 'pipes-death-counter-response';

    return {
        initialize : function () {
            socket = io.connect(url);
        },

        send : {
            register : function ( data ) {
                socket.emit(REQUEST_REGISTER, data);
            },

            new_pipes : function ( data ) {
                socket.emit(REQUEST_NEW_PIPES, data);
            },

            update_game_state : function ( data ) {
                socket.emit(REQUEST_UPDATE_GAME_STATE, data);
            },

            update_bird_state : function ( data ) {
                socket.emit(REQUEST_UPDATE_BIRD_STATE, data);
            },

            request_sync_x : function ( data ) {
                socket.emit(REQUEST_SYNC_X, data);
            },

            update_score : function ( data ) {
                socket.emit(REQUEST_UPDATE_SCORE, data);
            },

            increment_pipe_death_counter : function ( data ) {
                socket.emit(REQUEST_INC_PIPE_COUNTER, data);
            },

            request_pipes_death_counter : function ( data ) {
                socket.emit(REQUEST_PIPES_DEATH_COUNTER, data);
            }
        },

        on : {
            register_success : function ( callback ) {
                socket.on(RESPONSE_REGISTER_SUCCESS, callback);
            },

            register_failure : function ( callback ) {
                socket.on(RESPONSE_REGISTER_FAILURE, callback);
            },

            client_list_returned : function ( callback ) {
                socket.on(RESPONSE_CLIENT_LIST, callback);
            },

            pipes_returned : function ( callback ) {
                socket.on(RESPONSE_NEW_PIPES, callback);
            },

            client_list_returned_for_game : function ( callback ) {
                socket.on(RESPONSE_CLIENTS_FOR_GAME, callback);
            },

            response_sync_x : function ( callback ) {
                socket.on(RESPONSE_SYNC_X, callback);
            },

            response_update_score : function ( callback ) {
                socket.on(RESPONSE_UPDATE_SCORE, callback);
            },

            response_pipes_death_counter : function ( callback ) {
                socket.on(RESPONSE_PIPES_DEATH_COUNTER, callback);
            }
        },

        remove : {
            client_list_returned_for_game : function () {
                socket.removeAllListeners(RESPONSE_CLIENTS_FOR_GAME);
            }
        }
    }
})();