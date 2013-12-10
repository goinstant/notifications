/*global $, window, goinstant, console, jQuery */
'use strict';

var Notifications = window.goinstant.widgets.Notifications;

function connect(options) {
  var connectUrl = 'https://goinstant.net/goinstant-services/docs';
  var connection = new goinstant.Connection(connectUrl, options);

  connection.connect(function(err, connection) {
    if (err) {
      console.error('could not connect:', err);
      return;
    }
    joinRoomAndSetupListeners(connection);
  });
}

function joinRoomAndSetupListeners(connection) {

  var roomName = getOrSetRoomCookie("notifications");
  var currentRoom = connection.room(roomName);

  currentRoom.join(function(err) {
    if (err) {
      console.error('Error joining room:', err);
      return;
    }

    setupNotifications(currentRoom);
  });
}

function setupNotifications(currentRoom) {
  var notifications = new Notifications();

  notifications.subscribe(currentRoom, function(err) {
    if (err) {
      console.log("ERROR subscribing:", err);
      return;
    }
  });

  $("#btn-success").click(function(evt) {
    evt.preventDefault();
    notifications.publish({
      room: currentRoom,
      type: 'success',
      message: 'Success: Message delivered'
    }, function(err) {
      if (err) {
        console.log("ERROR:", err);
        return;
      }
      // Notification sent
    });
  });
  $("#btn-info").click(function(evt) {
    evt.preventDefault();
    notifications.publish({
      room: currentRoom,
      type: 'info',
      message: 'Info: Message delivered'
    }, function(err) {
      if (err) {
        console.log("ERROR:", err);
        return;
      }
      // Notification sent
    });
  });
  $("#btn-warning").click(function(evt) {
    evt.preventDefault();
    notifications.publish({
      room: currentRoom,
      type: 'warning',
      message: 'Warning: Message delivered'
    }, function(err) {
      if (err) {
        console.log("ERROR:", err);
        return;
      }
      // Notification sent
    });
  });
  $("#btn-error").click(function(evt) {
    evt.preventDefault();
    notifications.publish({
      room: currentRoom,
      type: 'error',
      message: 'Error: Message delivered'
    }, function(err) {
      if (err) {
        console.log("ERROR:", err);
        return;
      }
      // Notification sent
    });
  });
}

$(window).ready(function() {
  // window.options comes from an inline script tag in each iframe.
  connect(window.options);
});
