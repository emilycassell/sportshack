// This function will change the state of the UI item
function updateSeat(seat, isStanding) {
    console.log("Seat " + seat + " = " + isStanding);
    var selector = "#seat_" + seat.toString();
    $(selector).toggleClass("fa-user", true);
    $(selector).toggleClass("fas", isStanding);
    $(selector).toggleClass("far", !isStanding);
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
                updateSeat(parseInt(childKey), childData == '1');
            });
        });

        // Wire up standup button
        $("#app_btn_stand").click(function() {
            alert("standing!");
        });

    } catch (err) {
        alert("An error occurred...");
        alert(err);
    }
});