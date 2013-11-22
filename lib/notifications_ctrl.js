/*jshint browser:true, node:false*/
/*global module, require*/

'use strict';

/**
 * @module goinstant/components/Notifications
 * @exports NotificationsCtrl
 */

module.exports = NotificationsCtrl;

/** Module dependencies */

var NotificationView = require('./notification_view.js');
var _ = require('lodash');
var classes = require('classes');

/** Module constants **/

var CONTAINER_CLASS = 'gi-notify-container';
var CONTAINER_CLASS_CUSTOM = '.gi-notify-container-custom';
var OVERRIDE_CLASS = 'gi-override';
var POSITION_CLASS = 'gi-notify-<%- position %>';

function NotificationsCtrl(options) {
  this._options = options;
  this._pendingNotifications = []; // Notification container
  this._activeNotifications = []; // Notifications currently in the DOM

  // Expose constants
  this.CONTAINER_CLASS = CONTAINER_CLASS;
  this.CONTAINER_CLASS_CUSTOM = CONTAINER_CLASS_CUSTOM;
  this.OVERRIDE_CLASS = OVERRIDE_CLASS;

  _.bindAll(this);
}

/**
 * Add an incoming notification to the pending notifications queue
 *
 * @private
 * @param {Object} notificationData
 * @see Notification#_addContainer()
 */
NotificationsCtrl.prototype.handler = function(notificationData) {
  if (this.disabled) {
    return;
  }

  this._addContainer();

  var notification = new NotificationView(notificationData, this._container);

  this._pendingNotifications.push(notification);
  this._displayNotifications();
};

/**
 * Render the notification container
 *
 * @private
 */
NotificationsCtrl.prototype._addContainer = function() {
  // Don't render the container twice
  if (this._container) {
     return;
  }

  if (this._options.container) {
    this._container = this._options.container;
    return;
  }

  var position = _.template(POSITION_CLASS, {
    position: this._options.position
  });

  this._container = this._options.container || document.createElement('div');

  var containerClasses = [OVERRIDE_CLASS, position];

  if (this._options.container) {
     containerClasses.push(CONTAINER_CLASS_CUSTOM);
  } else {
     containerClasses.push(CONTAINER_CLASS);
  }

  for (var i = 0; i < containerClasses.length; ++i) {
    classes(this._container).add(containerClasses[i]);
  }

  document.body.appendChild(this._container);
};

/**
 * Removes the container after all the notifications have been displayed.
 * @private
 */
NotificationsCtrl.prototype._removeContainer = function() {
  if (!this._container || this._options.container) {
    return;
  }

  this._container.parentNode.removeChild(this._container);

  // Mark as null so that it'll be re-appended when the next notification comes.
  this._container = null;
};

/**
 * Displays pending notifications
 *
 * @private
 */
NotificationsCtrl.prototype._displayNotifications = function() {
  var self = this;

  // Current queue details
  var pending = this._pendingNotifications.length;
  var active = this._activeNotifications.length;
  var max = this._options.maxDisplayed;

  // While we have pending notifications and we're not at our display limit
  // display a new notification
  if (pending > 0 && active < max) {
    // Pull a notification from the queue
    var notification = this._pendingNotifications.shift();

    notification.render(this._options.displayTimer);

    notification.on('remove', this._notificationRemoved);

    // Increment the active notifications
    self._activeNotifications.push(notification);
  }
};

/**
 * Handler for when a notification times out and is removed from the DOM.
 * @private
 */
NotificationsCtrl.prototype._notificationRemoved = function() {
  if (this.disabled) {
    return;
  }

  this._activeNotifications.shift();
  this._displayNotifications();

  if (this._activeNotifications.length <= 0) {
    this._removeContainer();
  }
};

/**
 * Disable the controller and remove the container
 *
 * @private
 */
NotificationsCtrl.prototype.destroy = function() {
  this.disabled = true;
  if (this._container && !this._options.container) {
    document.body.removeChild(this._container);
  }
};
