// TODO : TEST CASE no history (last seen state is null...)
// TODO : add the view (template + enabling disabling of buttons in function of state)
// TODO : add the tooltips
// TODO : add the possibility to add conditions one by one on a given transition
// TODO : entry and exit actions??
//{from: states.cd_loaded_group, to: states.cd_stopped, event: cd_player_events.NEXT_TRACK, condition: is_last_track, action: stop},
//{from: states.cd_loaded_group, to: states.history.cd_loaded_group, event: cd_player_events.NEXT_TRACK, condition: is_not_last_track, action: go_next_track},
////vs. {from: states.cd_loaded_group, to: states.cd_stopped, event: cd_player_events.NEXT_TRACK, conditions: [
////      {condition: is_last_track, to: states.cd_stopped, action: stop},
////      {condition: is_not_last_track, to: states.history.cd_loaded_group, action: go_next_track}
////    ]},
// TODO : Add termination connector (T)?
// TODO : test all cases (review code) - for instance action depending on condition
// TODO : abstract the tree traversal for the build states part
// TODO : lift the fsm to streams
// TODO : externalize action with possibility to wait for values or move on
// TODO : DSL
// TODO : write program which takes a transition specifications and draw a nice graph out of it with yed or else
// TODO : think about the concurrent states (AND states)


// CONTRACT : no transition from the history state (history state is only a target state)
// CONTRACT : init events only acceptable in nesting state (aka grouping state)
// NOTE : enforced via in_auto_state only true for grouping state
// CONTRACT : Automatic actions with no events and only conditions are not allowed in nesting state (aka grouping state)
// NOTE : That would lead to non-determinism if A < B < C and both A and B have such automatic actions
// NOTE : Dead states:
// - Possible if automatic actions (no events) with conditions always true. If there is not another condition which at some
// point is set to false, we have an infinite loop (a very real one which could monopolize the CPU if all actions are synchronous)
// - To break out of it, maybe put a guard that if we remain in the same state for X steps, transition automatically (to error or else)


// CONSTANTS
const INITIAL_STATE_NAME = 'nok';
const STATE_PROTOTYPE_NAME = 'State'; // !!must be the function name for the constructor State, i.e. State

/**
 * Takes a list of identifiers (strings), adds init to it, and returns a hash whose properties are the uppercased identifiers
 * For instance :
 * ('edit', 'delete') -> {EDIT: 'EDIT', DELETE : 'DELETE', INIT : 'INIT'}
 * If there is an init in the list of identifiers, it is overwritten
 * RESTRICTION : avoid having init as an identifier
 * @param array_identifiers {Array | arguments}
 * @returns {Object<String,String>}
 */
function create_event_enum(array_identifiers) {
    array_identifiers = array_identifiers.reduce ? array_identifiers : Array.prototype.slice.call(arguments);
    // NOTE : That will overwrite any other event called init...
    array_identifiers.push('init');
    return array_identifiers.reduce(function (acc, identifier) {
        acc[identifier.toUpperCase()] = identifier.toUpperCase();
        return acc;
    }, {})
}

/**
 * Returns the name of the function as taken from its source definition.
 * For instance, function do_something(){} -> "do_something"
 * @param fn {Function}
 * @returns {String}
 */
function get_fn_name(fn) {
    var tokens =
        /^[\s\r\n]*function[\s\r\n]*([^\(\s\r\n]*?)[\s\r\n]*\([^\)\s\r\n]*\)[\s\r\n]*\{((?:[^}]*\}?)+)\}\s*$/
            .exec(fn.toString());
    return tokens[1];
}

/**
 * Processes the hierarchically nested states and returns miscellaneous objects derived from it:
 * `is_group_state` : {Object<String,Boolean>} Hash whose properties (state names) are matched with whether that state is a nested state
 * `hash_states` : Hierarchically nested object whose properties are the nested states.
 * - Nested states inherit (prototypal inheritance) from the containing state.
 * - Holds a `history` property which holds a `last_seen_state` property which holds the latest state for that hierarchy group
 *   For instance, if A < B < C and the state machine leaves C for a state in another branch,
 *   then `last_seen_state` will be set to C for A, B and C
 * - Holds an `active` property which is not so useful so far, and which signal whether the state is active (current) or not
 * - Tthe root state (NOK) is added to the whole hierarchy, i.e. all states inherit from the root state
 * `states` {Object<String,Boolean>} : Hash which maps every state name with itself
 * `states.history` {Object<String,Function>} : Hash which maps every state name with a function whose name is the state name
 * @param states
 * @returns {{hash_states: {}, is_group_state: {}}}
 */
function build_nested_state_structure(states, Rx) {
    var root_name = 'State';
    var last_seen_state_event_emitter = new Rx.Subject();
    var hash_states = {};
    var last_seen_state_listener_disposables = [];
    var is_group_state = {};

    // Add the starting state
    states = {nok: states};

    ////////
    // Helper functions
    function add_last_seen_state_listener(child_name, parent_name) {
        last_seen_state_listener_disposables.push(
            last_seen_state_event_emitter.subscribe(function (x) {
                var event_emitter_name = x.event_emitter_name
                var last_seen_state_name = x.last_seen_state_name;
                if (event_emitter_name === child_name) {
                    console.log(['last seen state set to', wrap(last_seen_state_name), 'in', wrap(parent_name)].join(" "));
                    hash_states[parent_name].history.last_seen_state = last_seen_state_name;
                }
            }));
    }

    function build_state_reducer(states, curr_constructor) {
        Object.keys(states).forEach(function (state_name) {
            var state_config = states[state_name];
            var curr_constructor_new;

            // The hierarchical state mechanism is implemented by reusing the standard Javascript prototypal inheritance
            // If A < B < C, then C has a B as prototype which has an A as prototype
            // So when an event handler (transition) is put on A, that event handler will be visible in B and C
            hash_states[state_name] = new curr_constructor();
            hash_states[state_name].name = state_name;
            var parent_name = hash_states[state_name].parent_name = get_fn_name(curr_constructor);
            hash_states[state_name].root_name = root_name;
            hash_states[state_name].history = {last_seen_state: null};
            hash_states[state_name].active = false;

            // Set up the listeners for propagating the last seen state up the prototypal chain
            // Prototypal inheritance only works in one direction, we need to implement the other direction by hand
            // if A < B < C is a state hierarchy, to implement correctly the history mechanism, we need the last seen state
            // to be the same throughout the whole hierarchy. Prototypal inheritance does not help here as it works in
            // the opposite direction.
            // So we resort to an event emitter (here an RxJS subject) which connect C and B, B and A.
            // When state C is abandoned, then it updates it `last_seen_state` property and emits a change event,
            // B is subscribed to it, and updates its property and emits a change.
            // A is subscribed to B changes, so that the change event is propagated recursively up the hierarchy.
            // This is a reactive mechanim which is simpler that the interactive one where you adjust the whole hierarchy
            // when state C is abandoned.
            add_last_seen_state_listener(state_name, parent_name);

            if (typeof(state_config) === 'object') {
                is_group_state[state_name] = true;
                eval(['curr_constructor_new = function', state_name, '(){}'].join(" "));
                curr_constructor_new.name = state_name;
                curr_constructor_new.prototype = hash_states[state_name];
                build_state_reducer(state_config, curr_constructor_new);
            }
        })
    }

    function State() {
        this.history = {last_seen_state: null};
    }

    // The `emitLastSeenStateEvent` is set on the State object which is inherited by all state objects, so it can be
    // called from all of them when a transition triggers a change of state
    State.prototype = {
        emitLastSeenStateEvent: function (x) {
            last_seen_state_event_emitter.onNext(x);
        },
        current_state_name: INITIAL_STATE_NAME
    };

    hash_states[INITIAL_STATE_NAME] = new State();
    hash_states[STATE_PROTOTYPE_NAME] = new State();

    build_state_reducer(states, State);

    return {
        hash_states: hash_states,
        is_group_state: is_group_state
    };
}

/**
 * Returns a hash which maps a state name to :
 * - a string identifier which represents the standard state
 * - a function whose name is the state name to represent the state history (set in the `history` property of the hash)
 * @param states A hash describing a hierarchy of nested states
 * @returns {state_name: {String}, {history: {Function}}}
 */
function build_state_enum(states) {
    var states_enum = {history: {}};

    // Set initial state
    states_enum.NOK = INITIAL_STATE_NAME;

    function build_state_reducer(states) {
        Object.keys(states).forEach(function (state_name) {
            var state_config = states[state_name];

            states_enum[state_name] = state_name;
            // All history states will be signalled through the history property, and a function instead of a value
            // The function name is the state name whose history is referred to
            var state_name_history_fn;
            eval(['state_name_history_fn = function', state_name, '(){}'].join(" "));
            states_enum.history[state_name] = state_name_history_fn;

            if (typeof(state_config) === 'object') {
                build_state_reducer(state_config);
            }
        })
    }

    build_state_reducer(states);

    return states_enum;
}


/**
 * TODO : document transition mechanism
 * - transition format
 *   - events : if not present, then actions become automatic
 *   - condition(s) : if several, pass them in an array (field `conditions`), the order of the array is the order
 *                    of applying the conditions. When a single condition (field `condition`)
 *                    When the first is found true, the sequence of condition checking stops there
 *   - action : function (model, event_data) : model_prime
 *   - from : state from which the described transition operates
 *   - to : target state for the described transition
 * @param hash_states_struct
 * @param events
 * @param transitions
 * @param model_initial
 * @returns {{send_event: send_event, start: start}}
 */
function create_state_machine(cd_player_states, events, transitions, model_initial, Rx) {
    var fsm;
    var new_model_event_emitter = new Rx.BehaviorSubject(model_initial);

    // Create the nested hierarchical
    var hash_states_struct = build_nested_state_structure(cd_player_states, Rx);

    // This will be the model object which will be updated by all actions and on which conditions will be evaluated
    // It is safely contained in a closure so it cannot be accessed in any way outside the state machine
    var model = {};
    var special_events = create_event_enum('auto', 'init');
    var is_init_state = {}; // {Object<state_name,boolean>}, allows to know whether a state has a init transition defined
    var is_auto_state = {}; // {Object<state_name,boolean>}, allows to know whether a state has an automatic transition defined
    var is_group_state = hash_states_struct.is_group_state; // {Object<state_name,boolean>}, allows to know whether a state is a group of state or not
    var hash_states = hash_states_struct.hash_states;

    transitions.forEach(function (transition) {
        console.log("processing transition:", transition);
        var from = transition.from, to = transition.to;
        var action = transition.action;
        var event = transition.event;
        // CONTRACT : `conditions` property used for array of conditions, otherwise `condition` property is used
        var arr_predicate = transition.conditions || transition.condition;
        // CASE : ZERO OR ONE condition set
        if ((arr_predicate && !arr_predicate.forEach) || !arr_predicate) arr_predicate = [
            {condition: arr_predicate, to: to, action: action    }
        ];

        // CASE : transition has a init event
        // NOTE : there should ever only be one, but we don't enforce it for now
        if (event === special_events.INIT) {
            is_init_state[from] = true;
        }

        var from_proto;
        from_proto = hash_states[from];
        // ERROR CASE : state found in transition but cannot be found in the events passed as parameter
        // NOTE : this is probably all what we need the events variable for
        if (event && !(event in events)) throw 'unknow event (' + event + ') found in state machine definition!'
        // CASE : automatic transitions : no events - likely a transient state with only conditions
        if (!event) {
            event = special_events.AUTO;
            is_auto_state[from] = true;
        }
        // CASE : automatic transitions : init event automatically fired upon entering a grouping state
        if (is_group_state[from] && is_init_state[from]) {
            is_auto_state[from] = true;
        }

        console.log("This is transition for event:", event);
        console.log("Predicates:", arr_predicate);

        from_proto[event] = arr_predicate.reduce(function (acc, condition, index) {
            var action = condition.action || identity;
            console.log("Condition:", condition);
            var condition_checking_fn = (function (condition) {
                var condition_suffix = '';
                // We add the `current_state` because the current state might be different from the `from` field here
                // This is the case for instance when we are in a substate, but through prototypal inheritance it is
                // the handler of the prototype which is called
                var condition_checking_fn = function (model_, event_data, current_state) {
                    from = current_state || from;
                    var predicate = condition.condition;
                    condition_suffix = predicate ? '_checking_condition_' + index : '';
                    var to = condition.to;
                    var model_prime// = model; // CASE : no actions to execute, the model does not change
                    if (!predicate || predicate(model_, event_data)) {
                        // CASE : condition for transition is fulfilled so we can execute the actions...
                        console.info("IN STATE ", from);
                        console.info("WITH model, event data BEING ", model_, event_data);
                        console.info("CASE : "
                            + (predicate ? "condition " + predicate.name + " for transition is fulfilled"
                                : "automatic transition"));
                        if (action) {
                            // CASE : we do have some actions to execute
                            //                            console.log("CASE : ...so we execute the action " + get_fn_name(action));
                            console.info("THEN : we execute the action " + action.name);
                            model_prime = action(model_, event_data, fsm, events);
                        }

                        // Leave the current state
                        leave_state(from, model_, hash_states);

                        // ...and enter the next state (can be different from to if we have nesting state group)
                        var next_state = enter_next_state(to, model_prime, hash_states);

                        // Update the model after entering the next state
                        // TODO : is it better to send the new model notification in between states or on entering the next state?
                        model = update_model(model_, model_prime, from, next_state);
                        // Emit the new model event
                        new_model_event_emitter.onNext(model);
                        console.info("RESULTING IN : ", model);

                        return true; // allows for chaining and stop chaining condition
                    }
                    else {
                        // CASE : condition for transition is not fulfilled
                        console.log("CASE : "
                            + (predicate ? "condition " + predicate.name + " for transition NOT fulfilled..."
                                : "no predicate"));
                        return false;
                    }
                };
                condition_checking_fn.displayName = from + condition_suffix;
                return condition_checking_fn;
            })(condition);

            return function arr_predicate_reduce_fn(model_, event_data, current_state) {
                var condition_checked = acc(model_, event_data, current_state);
                return condition_checked
                    ? true
                    : condition_checking_fn(model_, event_data, current_state);
            }
        }, function () {
            return false
        });
    });

    function send_event(event, event_data) {
        process_event(hash_states_struct.hash_states, event, event_data, model);
    }

    function process_event(hash_states, event, event_data, model) {
        console.log("Processing event ", event, event_data);
        var current_state = hash_states[INITIAL_STATE_NAME].current_state_name;
        var event_handler = hash_states[current_state][event];

        if (event_handler) {
            // CASE : There is a transition associated to that event
            log("found event handler!");
            console.info("WHEN EVENT ", event);
            event_handler(model, event_data, current_state);
            // send the AUTO event to trigger transitions which are automatic
            // i.e. transitions without events
            // event_handler(model, special_events.AUTO);
            process_automatic_events(hash_states, event_data);
            return;
        }
        else {
            // CASE : There is no transition associated to that event from that state
            var error_msg = 'There is no transition associated to that event!';
            model = update_model_with_error(model, event, event_data, error_msg);
            // Emit the new model event
            new_model_event_emitter.onNext(model);

            console.error(error_msg);
            return;
        }
    }

    function process_automatic_events(hash_states, previously_processed_event_data) {
        var current_state = hash_states[INITIAL_STATE_NAME].current_state_name;
        // Two cases here:
        // 1. Init handlers, when present on the current state, must be acted on immediately
        // This allows for sequence of init events in various state levels
        // For instance, L1: init -> L2:init -> L3:init -> L4: stateX
        // In this case event_data will carry on the data passed on from the last event (else we loose the model?)
        // 2. transitions with no events associated, only conditions (i.e. transient states)
        //    In this case, there is no need for event data
        if (is_auto_state[current_state]) {
            // CASE : transient state with no triggering event, just conditions
            var auto_event = is_init_state[current_state] ? special_events.INIT : special_events.AUTO;
            send_event(auto_event, previously_processed_event_data);
        }
        return;
    }

    function update_model(model, model_prime, from, to, error) {
        // For now, very simple update
        // NOTE : could be adapted to use immutable data structure
        // NOTE : Model decorated with state information for tracing and displaying purposes
        model_prime.__from = from;
        model_prime.__to = to;
        return update_model_with_error(model_prime, error);
    }

    function update_model_with_error(model, event, event_data, error_msg) {
        model.__error = error_msg;
        model.__event = event;
        model.__event_data = event_data;
        return model;
    }

    function leave_state(from, model, hash_states) {
        // NOTE : model is passed as a parameter for symetry reasons, no real use for it so far
        var state_from = hash_states[from];
        var state_from_name = state_from.name;

        // Set the `last_seen_state` property in the object representing that state's state (!)...
        state_from.history.last_seen_state = state_from_name;
        state_from.active = false;
        console.log("left state", wrap(from));

        // ... and emit the change event for the parents up the hierarchy to update also their last_seen_state properties
        // This updating solution is preferred to an imperative solution, as it allows not to think too much
        // about how to go up the hierarchy
        // There is no big difference also, as by default subject emits synchronously their values to all subscribers.
        // The difference in speed should be neglectable, and anyways it is not expected to have large state chart depths
        state_from.emitLastSeenStateEvent({
            event_emitter_name: state_from_name,
            last_seen_state_name: state_from_name
        });
    }

    function enter_next_state(to, model_prime, hash_states) {
        // Enter the target state
        var state_to;
        var state_to_name;
        // CASE : history state (H)
        if (typeof(to) === 'function') {
            state_to_name = get_fn_name(to);

            var target_state = hash_states[state_to_name].history.last_seen_state;
            state_to_name = target_state
                // CASE : history state (H) && existing history, target state is the last seen state
                ? target_state
                // CASE : history state (H) && no history (i.e. first time state is entered), target state is the entered state
                : state_to_name;
            state_to = hash_states[state_to_name];
        }
        // CASE : normal state
        else if (to) {
            state_to = hash_states[to];
            state_to_name = state_to.name;
        }
        else {
            throw 'enter_state : unknown case! Not a state name, and not a history state to enter!'
        }
        state_to.active = true;
        hash_states[INITIAL_STATE_NAME].current_state_name = state_to_name;

        console.info("AND TRANSITION TO STATE", state_to_name);
        return state_to_name;
    }

    function start() {
        return send_event(events.INIT, model_initial);
    }

    return fsm = {
        send_event: send_event,
        start: start,
        new_model_event_emitter: new_model_event_emitter
    }
}
