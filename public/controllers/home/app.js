// Global variables
var gl_sportshack = {
    id: null,
    participants: 0,
    numSeats: 0,
    touchInterval: null
};

// This function will change the state of the UI item
function updateSeat(seat, isStanding) {
    console.log("Seat " + seat + " = " + isStanding);
    var selector = "#seat_" + seat.toString();
    $(selector).toggleClass("fa-user", true);
    $(selector).toggleClass("fas", isStanding);
    $(selector).toggleClass("far", !isStanding);
}

// Update experience when participant count changes
function updateParticipantCount(newCount) {
    console.log("NewCount = " + newCount);
    gl_sportshack.participants = newCount;
    console.log("Received updated participant count: " + gl_sportshack.participants.toString());
    $("#app_participant_count").text(gl_sportshack.participants.toString() + " participants");
}

function updateSeatDisplay(newCount) {
    console.log('[updateSeatDisplay] New seat count received: ' + newCount);
    var seats = $('#seats').empty();
    for (var loop = 0; loop < newCount; loop++) {
        seats.append('<div id="seat_' + loop.toString() + '"></div>');
        updateSeat(loop, false);
    }
}

function touchServer(id) {
    $.ajax({
        url: '/api/touch/' + id,
        dataType: 'json'
    }).done(function(response) {
        gl_sportshack.participants = response.participants;

        // Ajax request completed
        console.log("Participation touch successful.");
    });
}

function onStandUp(id) {
    $.ajax({
        url: '/api/standup/' + id,
        dataType: 'json'
    }).done(function(response) {
        console.log("Standup completed successfully.");
    });
}

// Open the firebase when the page is ready
$(document).ready(function() {
    try {
        // Initialize Firebase
        var config = {
            apiKey: "AIzaSyAjJxeTIfuyF8gEbv5OQzFUrnSZtnHn58s",
            authDomain: "sportshack-0725.firebaseapp.com",
            databaseURL: "https://sportshack-0725.firebaseio.com",
            projectId: "sportshack-0725",
            storageBucket: "sportshack-0725.appspot.com",
            messagingSenderId: "306433267649"
        };
        firebase.initializeApp(config);
        console.info("Firebase is initialized.");

        // Get a reference to the database service
        let database = firebase.database();

        // Subscribe to be notified of changes to the database
        var seats = firebase.database().ref('seats');
        seats.on('value', function(snapshot) {
            console.log("State of seats has changed.");

            snapshot.forEach(function(childSnapshot) {
                var childKey = childSnapshot.key;
                var childData = childSnapshot.val();
                updateSeat(parseInt(childKey), childData.standing == '1');
            });
        });

        // Subscribe to be notified of subscriber count changes
        var subscribers = firebase.database().ref('global_state/participants');
        subscribers.on('value', function(snapshot) {
            console.log("Participant count has changed.");
            var childData = snapshot.val();
            console.log(childData);
            updateParticipantCount(parseInt(childData));
        });

        // Join the app, get an ID and a seat
        $.ajax({
            url: '/api/join',
            dataType: 'json'
        }).done(function(response) {
            gl_sportshack.id = response.id;
            gl_sportshack.numSeats = response.numSeats;

            // Ajax request completed
            console.log(response);

            // Start interval timer to keep doing the touch
            gl_sportshack.touchInterval = setInterval(function() {
                touchServer(gl_sportshack.id);
            }, 5000);

            // Update display of seats
            updateSeatDisplay(gl_sportshack.numSeats);
        });

        // Wire up standup button
        $("#app_btn_stand").click(function() {
            onStandUp(gl_sportshack.id);
        });

    } catch (err) {
        alert("An error occurred...");
        alert(err);
    }
});