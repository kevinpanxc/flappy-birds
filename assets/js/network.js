var Network = (function () {
    var socket;
    var url = document.URL;

    var REQUEST_REGISTER = 'register-request';
    var REQUEST_NEW_PIPES = 'pipes-request';
    var REQUEST_UPDATE_STATE = 'update-state-request';
    var REQUEST_JUMP = 'jump-request';
    var REQUEST_STATE = 'state-request';

    var RESPONSE_REGISTER_SUCCESS = 'register-success-response';
    var RESPONSE_REGISTER_FAILURE = 'register-failure-response';
    var RESPONSE_CLIENT_LIST = 'client-list-response';
    var RESPONSE_CLIENTS_FOR_GAME = 'clients-game-response';
    var RESPONSE_NEW_PIPES = 'pipes-response';
    var RESPONSE_STATE = 'state-response';

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

            update_state : function ( data ) {
                socket.emit(REQUEST_UPDATE_STATE, data);
            },

            jump : function ( data ) {
                socket.emit(REQUEST_JUMP, data);
            },

            request_state : function ( data ) {
                socket.emit(REQUEST_STATE, data);
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

            response_state : function ( callback ) {
                socket.on(RESPONSE_STATE, callback);
            }
        },

        remove : {
            client_list_returned_for_game : function () {
                socket.removeAllListeners(RESPONSE_CLIENTS_FOR_GAME);
            }
        }
    }
})();