var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // BodyParser pour POST
var winston = require('winston');
var morgan = require('morgan');
var admin = require('firebase-admin');
var serviceAccount = require('./keys/sportshack-0725-e97f5ef5ec4b.json');
const uuidv4 = require('uuid/v4');
const num_seats = 37;
const stand_timeout = 2000;
const touch_timeout = 20000;

let gl = {
    participants: 0,
    playerDict: {},
    seats: []
};

winston.log('info', '[Global] Starting up the app server.');
app.use(morgan('combined'));

// parsing
app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.sendfile('default.html', { root: __dirname + "/public/views/home" });
});

app.get('/', function(req, res) {
    res.sendfile('default.html', { root: __dirname + "/public/views/home" });
});

app.use('/', express.static('public'))

function removeParticipant(guid) {
    try {
        var player = gl.playerDict[guid];
        if (player) {

            // Remove player from the players dictionary
            delete gl.playerDict[guid];
            gl.participants = gl.participants - 1;
            winston.info("[removeParticipant] Removed participant from players list " + guid);

            // Release the player's seat
            for (var seatNum = 0; seatNum < num_seats; seatNum++) {
                if (gl.seats[seatNum] === guid) {
                    gl.seats[seatNum] = null;
                    winston.info("[removeParticipant] Released seat " + seatNum.toString());
                }
                break;
            }

            // Update firebase with new participant count
            admin.database().ref('global_state').set({
                participants: gl.participants
            });
        }
        winston.info("[removeParticipant] Removed player for lack of contact " + guid);
    } catch (err) {
        winston.error("Error removing participant");
        winston.error(err);

        return -1;
    }

}

function processPlayerTimeout(guid) {
    winston.info("[processPlayerTimeout] Timeout expired for user " + guid);
    removeParticipant(guid);
}

function processPlayerStandTimeout(guid) {
    try {
        var player = gl.playerDict[guid];
        if (player) {
            onSitDown(player.seat);
            player.standTimeout = null;
        }
    } catch (err) {
        winston.error("[processPlayerStandTimeout] Error processing the sitdown action");
        winston.error(err);

    }
}

function makeUserTouchTimeout(guid) {
    return setTimeout(processPlayerTimeout.bind(null, guid), touch_timeout);
}

function addParticipant(guid) {
    gl.participants = gl.participants + 1;

    try {
        admin.database().ref('global_state').set({
            participants: gl.participants
        });

        // Capture the players ID and set the timeout for removal
        var touchTimeout = makeUserTouchTimeout(guid);

        // Find a seat
        var assigned_seat = -1;
        for (var seatNum = 0; seatNum < num_seats; seatNum++) {
            // Issue the seat to the player
            if (gl.seats[seatNum] == null) {
                gl.seats[seatNum] = guid;

                // Record the assigned seat
                assigned_seat = seatNum;
                break;
            }
        }

        // Inserts a player object
        var player = {
            id: guid,
            touchTimeout: touchTimeout,
            standTimeout: null,
            seat: assigned_seat
        };

        // Store player object
        gl.playerDict[guid] = player;

        return player.seat;

    } catch (err) {
        winston.error("Error updating participant count in Firebase");
        winston.error(err);

        return -1;
    }
}

function onStandUp(seat) {
    try {
        var key = 'seats/' + seat.toString();
        admin.database().ref(key).set({
            standing: 1
        });
    } catch (err) {
        winston.error("Error standing up seat " + seat + " in firebase");
        winston.error(err);
    }
}

function onSitDown(seat) {
    try {
        admin.database().ref('seats/' + seat.toString()).set({
            standing: 0
        });
    } catch (err) {
        winston.error("Error sitting down seat " + seat + " in firebase");
        winston.error(err);
    }
}



// API METHODS  *******************************************
app.use('/api/join', function(req, res) {
    try {
        if (gl.participants >= num_seats) {
            res.status(400);
            res.send('Sorry the stadium is full! Come back later!');
            return;
        }

        var guid = uuidv4();
        var mySeat = addParticipant(guid);

        res.json({
            id: guid,
            seat: mySeat,
            numSeats: num_seats
        });
    } catch (err) {
        winston.error("[api/join] Error handing join request");
        winston.error(err);
    }
});

// Called every n seconds by the client to keep participation alive.  Must pass in ID
app.use('/api/touch/:id', function(req, res) {
    try {
        var id = req.params.id;
        winston.info("Received touch from " + id);

        var player = gl.playerDict[id];
        if (player) {
            // Reset the timeout
            clearTimeout(player.touchTimeout);
            player.touchTimeout = makeUserTouchTimeout(player.id);
        }

        // Return participant count
        var reply = {
            participants: gl.participants
        };
        res.json(reply);
    } catch (err) {
        winston.error("[api/touch] Error processing touch request: " + req.url);
        winston.error(err);
    }
});

// Called when user wants to STAND UP
app.use('/api/standup/:id', function(req, res) {
    try {
        var id = req.params.id;
        winston.info("Received STANDUP from " + id);

        var player = gl.playerDict[id];
        if (player && player.standTimeout === null) {

            // Stand the player up in the database
            onStandUp(player.seat)

            // Set the timer for sit down
            player.standTimeout = setTimeout(processPlayerStandTimeout.bind(null, player.id), stand_timeout);
        }

        // Return participant count
        var reply = {
            participants: gl.participants
        };
        res.json(reply);
    } catch (err) {
        winston.error("[api/touch] Error processing touch request: " + req.url);
        winston.error(err);
    }
});



/*
app.get('/', function(req, res) {
    res.send('Hello World!');
});
*/

function initApp() {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://sportshack-0725.firebaseio.com'
    });
    winston.info("[initApp] Firebase Admin initialized.");

    // Cleaning data - sit everyone down
    for (var loop = 0; loop < num_seats; loop++) {
        gl.seats[loop] = null;
        onSitDown(loop);
    }

};

initApp();
/*
// Toggle interval
let standing = false;
var interval = setInterval(function() {
    winston.info("Interval was invoked.");
    standing = !standing;
    winston.info("Standing = " + standing.toString());

    try {
        // Attempt to toggle node in the Firebase
        let isStanding = (standing === true) ? 1 : 0;
        admin.database().ref('seats/0').set({
            standing: isStanding
        });

    } catch (err) {
        winston.error("Error updating node state in Firebase");
        winston.error(err);
    }
}, 5000);
*/

app.listen(process.env.PORT || 8080, function() {
    console.log('Sportshack app listening.');
});