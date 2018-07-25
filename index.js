var express = require('express');
var app = express();
var bodyParser = require('body-parser'); // BodyParser pour POST
var winston = require('winston');
var morgan = require('morgan');
var admin = require('firebase-admin');
var serviceAccount = require('./keys/sportshack-0725-e97f5ef5ec4b.json');
const uuidv4 = require('uuid/v4');

let gl = {
    participants: 0,
    playerDict: {}
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
            delete gl.playerDict[guid];
            gl.participants = gl.participants - 1;

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

function makeUserTouchTimeout(guid) {
    return setTimeout(processPlayerTimeout.bind(null, guid), 20000);
}

function addParticipant(guid) {
    gl.participants = gl.participants + 1;

    try {
        admin.database().ref('global_state').set({
            participants: gl.participants
        });

        // Capture the players ID and set the timeout for removal
        var touchTimeout = makeUserTouchTimeout(guid);

        gl.playerDict[guid] = {
            id: guid,
            timeout: touchTimeout
        };

        // Find a seat
        return 0;

    } catch (err) {
        winston.error("Error updating participant count in Firebase");
        winston.error(err);

        return -1;
    }
}



// API METHODS
app.use('/api/join', function(req, res) {
    var guid = uuidv4();
    var mySeat = addParticipant(guid);

    res.json({
        id: guid,
        seat: mySeat
    });
});

// Called every n seconds by the client to keep participation alive.  Must pass in ID
app.use('/api/touch/:id', function(req, res) {
    try {
        var id = req.params.id;
        winston.info("Received touch from " + id);

        var player = gl.playerDict[id];
        if (player) {
            // Reset the timeout
            clearTimeout(player.timeout);
            player.timeout = makeUserTouchTimeout(player.id);
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


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://sportshack-0725.firebaseio.com'
});
winston.info("Firebase Admin initialized.");

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