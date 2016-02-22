function require_cd_player(){
    // cd_player object available to actions through closure
    var cd_player = {
        play: cd_player_play, stop: cd_player_stop, pause: cd_player_pause,
        open_drawer: log, close_drawer: log, next_track: cd_player_next_track,
        get_current_time: cd_player_get_current_time, get_current_track: cd_player_get_current_track,
        current_track: 0, current_time: 0, cd_tracks_play_time: [5, 3, 1, 2, 8],
        play_timeout_id: undefined, is_end_of_cd: cd_player_is_end_of_cd,
        go_track: cd_player_go_track, previous_track: cd_player_previous_track, get_last_track: cd_player_get_last_track,
        forward_1_s: cd_player_forward_1_s, backward_1_s: cd_player_backward_1_s
    };

    function cd_player_cancel_timer() {
        cd_player.play_timeout_id && window.clearInterval(cd_player.play_timeout_id);
    }
    function cd_player_get_track_time(current_track) {
        var current_time = 0;
        cd_player.cd_tracks_play_time.some(function (play_time, track_minus_1) {
            if (track_minus_1 + 1 < current_track) {
                current_time += play_time;
                return false;
            }
            return true;
        });
        return current_time;
    }
    function get_current_track_from_time(time) {
        var current_track = cd_player.cd_tracks_play_time.reduce(function (acc, track_duration, track_minus_1) {
            if (time >= acc.acc_track_duration) acc.candidate_track = track_minus_1 + 1;
            acc.acc_track_duration += track_duration;
            return acc;
        }, {candidate_track: 0, acc_track_duration: 0})
            .candidate_track;
        return current_track;
    }
    function cd_player_update_play_time(current_track, time) {
        var current_time;
        // cancel the previous timer
        cd_player_cancel_timer();
        // If time is not set, then it is 0
        if (time) {
            // case for example if we have a play after a pause
            current_time = time;
        }
        else {
            // case next_track
            current_time = cd_player_get_track_time(current_track);
        }
        cd_player.current_time = current_time;
        // update current_time with the time till the beginning of the track

        // set the timer to increment every second the current time
        function play_timer() {
            cd_player.current_time += 1;
            cd_player.current_track = get_current_track_from_time(cd_player.current_time);
            console.log("cd_player current time ", cd_player.current_time, "on track ", cd_player.current_track);
        }

        cd_player.play_timeout_id = window.setInterval(play_timer, 1000);
    }
    function cd_player_get_current_time() {
        return cd_player.current_time;
    }
    function cd_player_get_current_track() {
        return cd_player.current_track;
    }
    function cd_player_play(current_track, current_time) {
        log("cd player playing track " + current_track + " with current time " + current_time);
        cd_player.current_track = current_track;
        cd_player_update_play_time(cd_player.current_track, current_time);
    }
    function cd_player_stop(x) {
        x && log(x);
        cd_player_cancel_timer();
        cd_player.current_track = 0;
        cd_player.current_time = 0;
    }
    function cd_player_pause(x) {
        x && log(x);
        cd_player_cancel_timer();
    }
    function cd_player_next_track(x) {
        x && log(x);
        cd_player.current_track += 1;
        cd_player_go_track(cd_player.current_track);
    }
    function cd_player_is_end_of_cd(x) {
        x && log(x);
        function sum(a, b) {
            return 0 + a + b
        }

        return cd_player.current_time >= cd_player.cd_tracks_play_time.reduce(sum, 0);
    }
    function cd_player_go_track(track) {
        cd_player.current_track = track;
        cd_player.current_time = cd_player_get_track_time(track);
    }
    function cd_player_previous_track(x) {
        x && log(x);
        cd_player.current_track += -1;
        cd_player_go_track(cd_player.current_track);
    }
    function cd_player_get_last_track(x) {
        x && log(x);
        return cd_player.cd_tracks_play_time.length;
    }
    function cd_player_forward_1_s(x) {
        x && log(x);
        var extra_time = 1;
        cd_player.current_time += extra_time;
        (cd_player.current_time > cd_player.cd_tracks_play_time.reduce(sum, 0)) && (cd_player.current_time = 1);

        cd_player.current_track = get_current_track_from_time(cd_player.current_time);
    }
    function cd_player_backward_1_s(x) {
        x && log(x);
        var extra_time = -1;
        cd_player.current_time += extra_time;
        cd_player.current_time < 0 && (cd_player.current_time = cd_player.cd_tracks_play_time.reduce(sum, 0));
        cd_player.current_track = get_current_track_from_time(cd_player.current_time);
    }

    return cd_player;
}
