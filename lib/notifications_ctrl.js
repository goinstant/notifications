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

var WRAPPER_CLASS = 'gi-notify-wrapper';
var WRAPPER_CLASS_CUSTOM = 'gi-notify-wrapper-custom';
var OVERRIDE_CLASS = 'gi-override';
var POSITION_CLASS = 'gi-notify-<%- position %>';

function NotificationsCtrl(options) {
  this._options = options;

  this._container = options.container || document.body;
  this._wrapper = null;

  this._pendingNotifications = []; // Notification container
  this._activeNotifications = []; // Notifications currently in the DOM

  // Expose constants
  this.WRAPPER_CLASS = WRAPPER_CLASS;
  this.WRAPPER_CLASS_CUSTOM = WRAPPER_CLASS_CUSTOM;
  this.OVERRIDE_CLASS = OVERRIDE_CLASS;

  _.bindAll(this);
}

/*
 * Initializes the notification ctrl class
 *
 * @ptivate
 */
NotificationsCtrl.prototype.initialize = function() {
  this._wrapper = document.createElement('div');

  var position = _.template(POSITION_CLASS, {

    position: this._options.position
  });

  var wrapperClasses = [OVERRIDE_CLASS, position];

  if (this._options.container) {
     wrapperClasses.push(WRAPPER_CLASS_CUSTOM);
  } else {
     wrapperClasses.push(WRAPPER_CLASS);
  }

  for (var i = 0; i < wrapperClasses.length; ++i) {
    classes(this._wrapper).add(wrapperClasses[i]);
  }

  this._container.appendChild(this._wrapper);
};

/**
 * Add an incoming notification to the pending notifications queue
 *
 * @private
 * @param {Object} notificationData
 */
NotificationsCtrl.prototype.handler = function(notificationData) {
  if (this.disabled) {
    return;
  }

  var notification = new NotificationView(notificationData, this._wrapper);

  this._pendingNotifications.push(notification);
  this._displayNotifications();
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

  this._wrapper.style.display = 'block';
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
    //hide wrapper
    this._wrapper.style.display = 'none';
  }
};

/**
 * Disable the controller and remove the container
 *
 * @private
 */
NotificationsCtrl.prototype.destroy = function() {
  this.disabled = true;

  this._container.removeChild(this._wrapper);
};
