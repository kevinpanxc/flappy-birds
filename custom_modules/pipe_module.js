var all = new Array();

function generate_pipes () {
    var height_between_top_and_bottom_pipes = 90;
    var confirmed_height = 80;
    var constraint = 420 - height_between_top_and_bottom_pipes - (confirmed_height * 2); //double (for top and bottom)
    for (var i = 0; i < 50; i++) {
       var top_height = Math.floor((Math.random()*constraint) + confirmed_height); //confirmed height + randomly generated height
       var bottom_height = (420 - height_between_top_and_bottom_pipes) - top_height;
       all.push({top_height: top_height, bottom_height: bottom_height, death_counter: 0});
    }
}

function get_pipe(index) {
    while (index >= all.length - 1) {
        generate_pipes();
    }
    return all[index];
}

function get_pipes(index_1, index_2) {
    while (index_2 >= all.length - 1) {
        generate_pipes();
    }
    return all.slice(index_1, index_2 + 1);
}

module.exports = {
    get_pipe : get_pipe,
    get_pipes : get_pipes
}