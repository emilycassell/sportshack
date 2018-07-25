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

        // Get a reference to the database service
        let database = firebase.database();

        // Subscribe to be notified of changes to the database
        var starCountRef = firebase.database().ref('seats');
        starCountRef.on('value', function(snapshot) {
            alert("State of seats has changed.");
        });


    } catch (err) {
        alert("An error occurred...");
        alert(err);
    }
});