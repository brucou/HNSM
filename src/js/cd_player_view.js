function require_cd_player_view(Ractive) {
    var template = Ractive.extend({
        el: 'app',
        template: [
            '<div class="jumbotron">',
            '        <h1>HFSM demo : CD Player!</h1>',
            '        <span style="background-color: #F1F1F1; cursor: pointer" data-toggle="collapse" data-target="#cd_player_specs">Show user interface specifications (natural language)</span>',
            '        <div id="cd_player_specs" class="collapse">',
            '            <ol style="list-style: decimal inside;">',
            '                <li class="list-group-item">  There shall be eight buttons named: <kbd>Play</kbd>, <kbd>Pause</kbd>, <kbd>Stop</kbd>. <kbd>Previous</kbd>, <kbd>Next</kbd>, <kbd>Forward</kbd>, <kbd>Reverse</kbd>, and <kbd>Eject</kbd>.',
            '                </li>',
            '                <li class="list-group-item">  There shall be two text fields for displaying data. They shall be named <code>Time</code> and <code>Track</code>.',
            '                </li>',
            '                <li class="list-group-item"> When there is no disc in the CD player or when the CD player drawer is open, the system shall be in a state named <strong><em>&lt;No CD Loaded&gt;</em></strong>.',
            '                </li>',
            '                <li class="list-group-item"> When  the CD player drawer is closed and  a CD  is  in  the CD player,  the  system shall be  in one of three possible  states:  <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong>, or <strong><em>&lt;CD Paused&gt;</em></strong>.',
            '                </li>',
            '                <li class="list-group-item"> When in the <strong><em>&lt;No CD Loaded&gt;</em></strong> state, with the drawer open and a CD in the drawer, pressing the <kbd>Eject</kbd> button shall cause the drawer of the CD player to close and the system shall enter the <strong><em>&lt;CD Stopped&gt;</em></strong> state.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the  <strong><em>&lt;No CD Loaded&gt;</em></strong>  state,  with  the  drawer  open  and  no CD  in  the drawer, pressing the <kbd>Eject</kbd> button shall cause the drawer of the CD player to close and the system shall  remain  in the <strong><em>&lt;No CD Loaded&gt;</em></strong> state.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the  <strong><em>&lt;No CD Loaded&gt;</em></strong>  state,  pressing  the  <kbd>Play</kbd>,  <kbd>Pause</kbd>,  <kbd>Stop</kbd>,  <kbd>Previous</kbd>, <kbd>Next</kbd>, <kbd>Forward</kbd> and <kbd>Reverse</kbd> buttons shall have no effect.',
            '                </li>',
            '                <li class="list-group-item"> The  <strong><em>&lt;CD Playing&gt;</em></strong>  state  is  entered  from  the  <strong><em>&lt;CD Stopped&gt;</em></strong>  state  by  a  user clicking the <kbd>Play</kbd> button.',
            '                </li>',
            '                <li class="list-group-item"> The  <strong><em>&lt;CD Stopped&gt;</em></strong>  state  is  entered  from  the  <strong><em>&lt;CD Playing&gt;</em></strong>  state  by  a  user clicking the <kbd>Stop</kbd> button.',
            '                </li>',
            '                <li class="list-group-item"> The <strong><em>&lt;CD Paused&gt;</em></strong> state is entered from the <strong><em>&lt;CD Playing&gt;</em></strong> state by a user clicking the <kbd>Pause</kbd> button.',
            '                </li>',
            '                <li class="list-group-item"> The <strong><em>&lt;CD Playing&gt;</em></strong> state  is entered from the <strong><em>&lt;CD Paused&gt;</em></strong> state by a user clicking the <kbd>Pause</kbd> button or the <kbd>Play</kbd> button.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the <strong><em>&lt;CD Stopped&gt;</em></strong>  state,  the <code>&lt;Time&gt;</code>  field  shall  display <em>00:00</em> and the <code>&lt;Track&gt;</code> field shall display.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong> state,  the <kbd>Pause</kbd> and <kbd>Stop</kbd> buttons shall be disabled.',
            '                </li>',
            '                <li class="list-group-item"> When in the <strong><em>&lt;CD Playing&gt;</em></strong> state, the <kbd>Play</kbd> button shall be disabled.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking the <kbd>Next</kbd> button when  the current track  is not the  last track on the CD, will cause the CD player to move to the <kbd>Next</kbd> track,  the <code>&lt;Time&gt;</code> field will display <em>00:00</em> and the <code>&lt;Track&gt;</code> field shall display the  track number.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong>, or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking the <kbd>Next</kbd> button when  the current  track  is  the  last track on  the CD, will cause the CD player to move to the first track,  the <code>&lt;Time&gt;</code> field will display <em>00:00</em>, the <code>&lt;Track&gt;</code> field shall display  [1] and the <strong><em>&lt;CD Stopped&gt;</em></strong> state will be entered.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking the <kbd>Previous</kbd> button when the current track is not the first track on the CD, will cause the CD player to move to the previous track,  the <code>&lt;Time&gt;</code> field will display <em>00:00</em> and the <code>&lt;Track&gt;</code> field shall display  the track number.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking  the <kbd>Previous</kbd> button when the current track is the first track on the CD, will cause the CD player  to move  to  the  start  of the  first  track,  the <code>&lt;Time&gt;</code>  field will  display <em>00:00</em> and the <code>&lt;Track&gt;</code> field shall display.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking  the <kbd>Forward</kbd>  button  down  will  cause  the  CD  to  stop  playing  and  the  CD  to  step forwards through the CD in one-second intervals; each step will take no more than 0.1  seconds.  For each  step,  the <code>&lt;Time&gt;</code>  field will  display  the current  track  time and the <code>&lt;Track&gt;</code> field will display the current track number. The application will stop  stepping  through  the  CD when  the  user  stops  holding  down  the  <kbd>Forward</kbd> button with  the mouse pointer, or the end of the CD  is reached.  If the end of the CD is reached, the <strong><em>&lt;CD Stopped&gt;</em></strong> state will be entered and the <code>&lt;Time&gt;</code> field will display <em>00:00</em> and the <code>&lt;Track&gt;</code> field shall display.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states, clicking  the <kbd>Reverse</kbd>  button  down  will  cause  the  CD  to  stop  playing  and  the  CD  to  step backwards  through  the CD  in one-second  intervals; each  step will  take no more than 0.1  seconds.  For each  step,  the <code>&lt;Time&gt;</code>  field will  display  the current  track time and the <code>&lt;Track&gt;</code> field will display the current track number. The application will stop stepping through the CD when the user stops holding down the <kbd>Reverse</kbd> button with  the mouse pointer, or the start of the CD  is reached.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;CD Playing&gt;</em></strong> state, the <code>&lt;Time&gt;</code> field shall be updated every second with  the  elapsed  playing  time  of  the  current  track  and  the  <code>&lt;Track&gt;</code>  field  shall display the current track number.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the <strong><em>&lt;CD Paused&gt;</em></strong> state,  the values  in  the Time and Track fields will be displayed  initially  and  then after one  second  they will be hidden. After a further second  they  will  be  displayed  again.  This  displaying  and  hiding  cycle  will continue while  the system is in the <strong><em>&lt;CD Paused&gt;</em></strong> state.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the <strong><em>&lt;No CD Loaded&gt;</em></strong>, <strong><em>&lt;CD Stopped&gt;</em></strong>, <strong><em>&lt;CD Playing&gt;</em></strong> or <strong><em>&lt;CD Paused&gt;</em></strong> states,  the  balloon  help  for  the  buttons  shall  be  as  follows:  <kbd>Stop</kbd>  button  = Stop, <kbd>Previous</kbd> button = Previous Track, <kbd>Next</kbd> button = Next Track, <kbd>Forward</kbd> button = Step Forward, <kbd>Reverse</kbd> button = Step Backwards.',
            '                </li>',
            '                <li class="list-group-item"> When  in the <strong><em>&lt;No CD Loaded&gt;</em></strong> state and the CD player door is open, the  balloon help for the buttons shall be as follows: <kbd>Play</kbd> button = Play, <kbd>Pause</kbd>  button = Pause, and <kbd>Eject</kbd> button = Close.',
            '                </li>',
            '                <li class="list-group-item"> When in the <strong><em>&lt;No CD Loaded&gt;</em></strong> state and the CD player door is closed, the  balloon help for the buttons shall be as follows: <kbd>Play</kbd> button = Play, <kbd>Pause</kbd>  button = Pause, and <kbd>Eject</kbd> button = Eject.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the  <strong><em>&lt;CD Stopped&gt;</em></strong>  or  <strong><em>&lt;CD Playing&gt;</em></strong>  state,  the  balloon  help  for  the buttons shall be as  follows:  <kbd>Play</kbd> button = Play, <kbd>Pause</kbd>  button = Pause, and <kbd>Eject</kbd> button = Eject.',
            '                </li>',
            '                <li class="list-group-item"> When  in  the <strong><em>&lt;CD Paused&gt;</em></strong>  state,  the balloon  help  for  the  buttons  shall  be  as follows:  <kbd>Play</kbd>  button  = Resume,  <kbd>Pause</kbd>  button  = Resume,  and <kbd>Eject</kbd>  button  = Eject.',
            '                </li>',
            '            </ol>',
            '        </div>',
            '</div >',
            '<ol class="breadcrumb">',
            '    <li>Track {{current_track}}</li>',
            '    <li class="active">{{current_cd_play_time}}</li>',
            '</ol>',
            '<button id="play" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-play" aria-hidden="true"></span>',
            '    </button>',
            '<button id="pause" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-pause" aria-hidden="true"></span>',
            '</button>',
            '<button id="stop" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-stop" aria-hidden="true"></span>',
            '    </button>',
            '<button id="reverse_down" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-fast-backward" aria-hidden="true"></span>',
            '</button>',
            '<button id="previous_track" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-backward" aria-hidden="true"></span>',
            '    </button>',
            '<button id="next_track" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-forward" aria-hidden="true"></span>',
            '</button>',
            '<button id="forward_down" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-fast-forward" aria-hidden="true"></span>',
            '    </button>',
            '<button id="eject" type="button" class="btn btn-default" aria-label="Left Align">',
            '    <span class="glyphicon glyphicon glyphicon-eject" aria-hidden="true"></span>',
            '</button>',
            '<div class="panel panel-default">',
            '    <div class="panel-body">',
            '        <p>State <span class="badge">{{__to}}</span></p>',
            '    </div>',
            '</div>',
            '{{#__error}}',
            '<div class="panel panel-default">',
            '    <div class="panel-body">',
            '        <p>Warning/Errors  <span class="label-warning">Error occurred when processing event <kbd>{{__event}}</kbd> ({{__event_data}}) in state <strong><em>&lt;{{__from}}&gt;</em></strong> : {{__error}}</span></p>',
            '    </div>',
            '</div>',
            '{{/__error}}'
        ].join(" "),
        append: false,
        onconstruct: function (options) {
            this.event_emitter = options.event_emitter
        },
        onrender: function () {
            var self = this;

            function emit_click_event(button_id) {
                return function emit_event() {
                    self.event_emitter.onNext(button_id.toUpperCase());
                }
            }

            // set listeners for buttons
            var id_list = [
                'eject', 'pause', 'play', 'stop', 'next_track', 'previous_track', 'forward_down', 'reverse_down'
            ];
            id_list.forEach(function add_click_listener(button_id) {
                document.getElementById(button_id).addEventListener("mousedown", emit_click_event(button_id), false)
            });
            var mouseup_list = ['reverse_down', 'forward_down'];
            var mouseup_intent = ['reverse_up', 'forward_up'];
            mouseup_list.forEach(function add_mouseup_listener(button_id, index) {
                document.getElementById(button_id).addEventListener("mouseup", emit_click_event(mouseup_intent[index]), false);
            });
        }
    });

    return {
        template: template
    }
}
