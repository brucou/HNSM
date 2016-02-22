function require_cd_player_def() {
    // Object exposing APIs used by the GUI
    var cd_player = require_cd_player();

    // Model definition
    var model = {
        cd_in_drawer: true,
        current_track: undefined,
        last_track: undefined,
        current_cd_play_time: 0, //in s
        play_timeout_id: undefined,
        pause_timer_id: undefined,
        forward_timer_id: undefined,
        backward_timer_id: undefined,
        end_of_cd: false
    };

    // States definition
    var cd_player_states = {
        no_cd_loaded: {
            cd_drawer_closed: '', cd_drawer_open: '', closing_cd_drawer: ''
        },
        cd_loaded: {
            cd_loaded_group: {
                cd_paused_group: {
                    time_and_track_fields_not_blank: '', time_and_track_fields_blank: ''
                },
                cd_playing: '',
                cd_stopped: ''
            },
            stepping_forwards: '',
            stepping_backwards: ''
        }
    };
    var states = build_state_enum(cd_player_states);

    // Events definition
    var cd_player_events = create_event_enum([
        'eject', 'pause', 'play', 'stop', 'timer_expired', 'next_track', 'previous_track',
        'forward_up', 'forward_down', 'reverse_down', 'reverse_up'
    ]);

    // Predicates
    function is_cd_in_drawer(model, event_data) {
        return model.cd_in_drawer;
    }

    function is_not_cd_in_drawer(model, event_data) {
        return !model.cd_in_drawer;
    }

    function is_end_of_cd(model, event_data) {
        return cd_player.is_end_of_cd();
    }

    function is_not_end_of_cd(model, event_data) {
        return !is_end_of_cd();
    }

    function is_last_track(model, event_data) {
        return model.current_track >= model.last_track;
    }

    function is_track_gt_1(model, event_data) {
        return model.current_track > 1;
    }

    function is_track_eq_1(model, event_data) {
        return model.current_track === 1;
    }

    function is_not_last_track(model, event_data) {
        return !is_last_track(model, event_data);
    }

    // Actions
    function fsm_initialize_model(model, model_initial) {
        // Cloning the initial model, as it is conceptually a constant
        model = JSON.parse(JSON.stringify(model_initial));
        model.last_track = cd_player.get_last_track();
        return model;
    }

    function open_drawer(model, event_data) {
        cd_player.open_drawer('opening drawer...');
        return model;
    }

    function close_drawer(model, event_data) {
        cd_player.close_drawer('closing drawer...');
        return model;
    }

    function cancel_polling_timer(model) {
        model.play_timeout_id && window.clearInterval(model.play_timeout_id) && log("clearing play timer");
    }

    function cancel_timer(model) {
        model.forward_timer_id && window.clearTimeout(model.forward_timer_id) && log("clearing forward timer");
        model.backward_timer_id && window.clearTimeout(model.backward_timer_id) && log("clearing backward timer");
        model.pause_timer_id && log("clearing pause timer") && window.clearTimeout(model.pause_timer_id);
        return model;
    }

    function play(model, event_data, fsm, cd_player_events) {
        var initial_track = 1;
        var initial_cd_play_time = 0;

        cd_player.play(model.current_track || initial_track, model.current_cd_play_time || initial_cd_play_time);
        update_play_time(model, event_data, fsm, cd_player_events);
        model.play_timeout_id = create_polling_timer('play_timer', 1000);
        return model;
    }

    function poll_play_time(model, event_data, fsm, cd_player_events) {
        return update_play_time(model, event_data, fsm, cd_player_events);
    }

    function create_polling_timer(name, timeout) {
        console.log(name + ' started!');
        return window.setInterval(function timer() {
            fsm.send_event(cd_player_events.TIMER_EXPIRED, name);
        }, timeout);
    }

    function create_timer(name, timeout) {
        console.log(name + ' started!');
        return window.setTimeout(function timer() {
            fsm.send_event(cd_player_events.TIMER_EXPIRED, name);
        }, timeout);
    }

    function eject(model, event_data) {
        cancel_timer(model);
        cancel_polling_timer(model);
        var model_prime = stop(model);
        cd_player.open_drawer('opening drawer...');
        return model_prime;
    }

    function stop(model) {
        cancel_timer(model);
        cancel_polling_timer(model);
        cd_player.stop('stopping...');
        model.current_cd_play_time = 0;
        model.current_track = 0;
        model.play_timeout_id = undefined;
        model.pause_timer_id = undefined;
        model.forward_timer_id = undefined;
        model.backward_timer_id = undefined;
        return model;
    }

    function update_play_time(model, event_data, fsm, cd_player_events) {
        model.current_cd_play_time = cd_player.get_current_time();
        model.current_track = cd_player.get_current_track();
        return model;
    }

    function go_next_track(model, event_data, fsm, cd_player_events) {
        cd_player.next_track('going to next track...');
        return update_play_time(model, event_data, fsm, cd_player_events);
    }

    function go_track_1(model, event_data, fsm, cd_player_events) {
        cd_player.go_track(1);
        return update_play_time(model, event_data, fsm, cd_player_events);
    }

    function go_previous_track(model, event_data, fsm, cd_player_events) {
        cd_player.previous_track();
        return update_play_time(model, event_data, fsm, cd_player_events);
    }

    function pause_playing_cd(model, event_data, fsm, cd_player_events) {
        cancel_timer(model);
        cd_player.pause();
        return create_pause_timer(model);
    }

    function create_pause_timer(model) {
        model.pause_timer_id = create_timer('pause_timer', 500);
        return model;
    }

    function resume_paused_cd(model, event_data, fsm, cd_player_events) {
        cancel_timer(model);
        return play(model, event_data, fsm, cd_player_events);
    }

    function go_forward_1_s(model, event_data, fsm, cd_player_events) {
        // NOTE : we have to put this first line to cancel other timers that could conflict
        // This could be put into entry and exit state actions once we have implemented that
        // That would be cleaner as we should not care about previous state here
        stop_forward_timer(model);
        cd_player.forward_1_s();
        model = update_play_time(model, event_data, fsm, cd_player_events);
        model.forward_timer_id = create_timer('forward_timer', 250);
        return model;
    }

    function stop_forward_timer(model, event_data, fsm, cd_player_events) {
        model.forward_timer_id && window.clearTimeout(model.forward_timer_id);
        model.forward_timer_id = undefined;
        return model;
    }

    function go_backward_1_s(model, event_data, fsm, cd_player_events) {
        stop_backward_timer(model);
        cd_player.backward_1_s();
        update_play_time(model, event_data, fsm, cd_player_events);
        model.backward_timer_id = create_timer('backward_timer', 250);
        return model;
    }

    function stop_backward_timer(model, event_data, fsm, cd_player_events) {
        model.backward_timer_id && window.clearTimeout(model.backward_timer_id);
        model.backward_timer_id = undefined;
        return model;
    }

    // Transitions
    var cd_player_transitions = [
        {from: states.NOK, to: states.no_cd_loaded, event: cd_player_events.INIT, action: fsm_initialize_model},
        {from: states.no_cd_loaded, to: states.cd_drawer_closed, event: cd_player_events.INIT, action: open_drawer},
        {from: states.cd_drawer_closed, to: states.cd_drawer_open, event: cd_player_events.EJECT, action: close_drawer},
        {from: states.cd_drawer_open, to: states.closing_cd_drawer, event: cd_player_events.EJECT, action: identity},
        {from: states.closing_cd_drawer, conditions: [
            {condition: is_not_cd_in_drawer, to: states.cd_drawer_closed, action: identity},
            {condition: is_cd_in_drawer, to: states.cd_loaded, action: identity}
        ]},
        {from: states.cd_loaded, to: states.cd_loaded_group, event: cd_player_events.INIT, action: identity},
        //        {from: states.cd_playing, to: states.cd_playing, event: cd_player_events.TIMER_EXPIRED, condition: is_not_end_of_cd, action: poll_play_time},
        //        {from: states.cd_playing, to: states.cd_stopped, event: cd_player_events.TIMER_EXPIRED, condition: is_end_of_cd, action: stop},
        {from: states.cd_playing, event: cd_player_events.TIMER_EXPIRED, conditions: [
            {condition: is_not_end_of_cd, to: states.cd_playing, action: poll_play_time},
            {condition: is_end_of_cd, to: states.cd_stopped, action: stop}
        ]},
        {from: states.cd_playing, to: states.cd_paused_group, event: cd_player_events.PAUSE, action: pause_playing_cd},
        {from: states.cd_paused_group, to: states.cd_playing, event: cd_player_events.PAUSE, action: resume_paused_cd},
        {from: states.cd_paused_group, to: states.cd_playing, event: cd_player_events.PLAY, action: resume_paused_cd},
        {from: states.cd_paused_group, to: states.time_and_track_fields_not_blank, event: cd_player_events.INIT, action: identity},
        {from: states.time_and_track_fields_not_blank, to: states.time_and_track_fields_blank, event: cd_player_events.TIMER_EXPIRED, action: create_pause_timer},
        {from: states.time_and_track_fields_blank, to: states.time_and_track_fields_not_blank, event: cd_player_events.TIMER_EXPIRED, action: create_pause_timer},
        {from: states.cd_paused_group, to: states.cd_stopped, event: cd_player_events.STOP, action: stop},
        {from: states.cd_stopped, to: states.cd_playing, event: cd_player_events.PLAY, action: play},
        {from: states.cd_playing, to: states.cd_stopped, event: cd_player_events.STOP, action: stop},
        {from: states.cd_loaded_group, to: states.cd_stopped, event: cd_player_events.INIT, action: stop},
        {from: states.cd_loaded_group, event: cd_player_events.NEXT_TRACK, conditions: [
            {condition: is_last_track, to: states.cd_stopped, action: stop},
            {condition: is_not_last_track, to: states.history.cd_loaded_group, action: go_next_track}
        ]},
        {from: states.cd_loaded_group, event: cd_player_events.PREVIOUS_TRACK, conditions: [
            {condition: is_track_gt_1, to: states.history.cd_loaded_group, action: go_previous_track},
            {condition: is_track_eq_1, to: states.history.cd_loaded_group, action: go_track_1}
        ]},
        {from: states.cd_loaded, to: states.cd_drawer_open, event: cd_player_events.EJECT, action: eject},
        {from: states.stepping_forwards, event: cd_player_events.TIMER_EXPIRED, conditions: [
            {condition: is_not_end_of_cd, to: states.stepping_forwards, action: go_forward_1_s},
            {condition: is_end_of_cd, to: states.cd_stopped, action: stop}
        ]},
        {from: states.stepping_forwards, to: states.history.cd_loaded_group, event: cd_player_events.FORWARD_UP, action: stop_forward_timer},
        {from: states.cd_loaded_group, to: states.stepping_forwards, event: cd_player_events.FORWARD_DOWN, action: go_forward_1_s},
        {from: states.stepping_backwards, to: states.stepping_backwards, event: cd_player_events.TIMER_EXPIRED, action: go_backward_1_s},
        {from: states.stepping_backwards, to: states.history.cd_loaded_group, event: cd_player_events.REVERSE_UP, action: stop_backward_timer},
        {from: states.cd_loaded_group, to: states.stepping_backwards, event: cd_player_events.REVERSE_DOWN, action: go_backward_1_s},
    ];

    return {
        model: model,
        cd_player_states: cd_player_states,
        cd_player_events: cd_player_events,
        cd_player_transitions: cd_player_transitions
    }
}
