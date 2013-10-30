/*jshint browser:true, node:false*/
/*global module, require*/

'use strict';

/**
 * @module goinstant/components/Notifications
 * @exports NotificationView
 */

module.exports = NotificationView;

/** Module dependencies */

var _ = require('lodash');
var Emitter = require('emitter');
var events = require('event');

/** Notifications Template */

var notificationTemplate = require('../templates/template.html');

/**
 * Represents a single Notification view
 *
 * @constructor
 * @param {Object} notificationData
 * @param {Object} container
 */
function NotificationView(notificationData, container) {
  this._container = container;
  this._emitter = new Emitter();
  this._html = _.template(notificationTemplate, notificationData);

  _.bindAll(this);
}

/**
 * Renders the notification to the DOM and listens for close events
 *
 * @public
 * @param {Integer} delay
 */
NotificationView.prototype.render = function(delay) {
  this._delay = delay;
  this._el = document.createElement('div');
  this._el.innerHTML = this._html;

  if (!this._container.childNodes[0]) {
    this._container.appendChild(this._el);
  } else {
    this._container.insertBefore(this._el, this._container.childNodes[0]);
  }

  this._displayStarted = (new Date()).getTime();
  this._timerId = _.delay(this.remove, delay);

  var closeButton = this._el.querySelector('.gi-notify-close');

  events.bind(closeButton, 'click', this.remove);
  events.bind(this._el, 'mouseover', this._persist);
  events.bind(this._el, 'mouseout', this._persist);
};

/**
 * When a user hovers over the notification we extend its display time
 * when the user removes their cursor, a new delay is set on the notification
 * unless it would have already expired, in which case it's removed
 *
 * @private
 * @param {Object} event
 */
NotificationView.prototype._persist = function(e) {
  // Prevent the delay from removing the notification
  clearTimeout(this._timerId);

  var toElement = e.toElement || e.relatedTarget;

  // Persist the notification on mouseover
  if (e.type === 'mouseover' || this._isDescendant(this._el, toElement)) {
    return;
  }

  var currentTime =  (new Date()).getTime();
  var displayDuration = (currentTime - this._displayStarted);

  if (displayDuration >= this._delay) {
    this.remove();
  } else {
    this._displayStarted = currentTime;
    this._delay = (this._delay - displayDuration);
    this._timerId = _.delay(this.remove, this._delay);
  }
};

/**
 * Returns true if an element is the descendent of a node
 *
 * @private
 * @param {Object} node
 * @param {Object} descendant
 */
NotificationView.prototype._isDescendant = function(node, descendant) {
  if (node === descendant) {
    return true;
  }

  for (var i = 0; i < node.children.length; ++i) {
    if (this._isDescendant(node.children[i], descendant)) {
      return true;
    }
  }

  return false;
};

/**
 * Removes this notification from the DOM, turns off the listener,
 * and clears the timer
 *
 * @public
 */
NotificationView.prototype.remove = function() {
  if (!this._container || !this._el || !this._timerId) {
    return;
  }

  clearTimeout(this._timerId);

  this._container.removeChild(this._el);
  this._emitter.emit('remove');
  this._emitter.off();
};

/**
 * Currently only used to bind to the removal event
 *
 * @public
 */
NotificationView.prototype.on = function(event, callback) {
  this._emitter.on(event, callback);
};
