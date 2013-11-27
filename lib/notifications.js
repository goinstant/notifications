/*jshint browser:true, node:false*/
/*global module, require*/

'use strict';

/**
 * @module goinstant/components/Notifications
 * @exports Notifications
 */

module.exports = Notifications;

/** Module dependencies */

var _ = require('lodash');
var async = require('async');
var Emitter = require('emitter');
var NotificationsCtrl = require('./notifications_ctrl.js');

/** Module constants **/

var NOTIFICATION_CHANNEL = 'goinstant-widgets-notifications';
var POSITION_WL = [
  'top',
  'top-right',
  'top-left',
  'bottom',
  'bottom-right',
  'bottom-left'
];

/**
 * Creates a new instance of the Notifications component
 *
 * @constructor
 * @param {Object} options
 */
function Notifications(options) {

  var defaultOptions = {
    maxDisplayed: 3,
    displayTimer: 3000,
    position: 'top',
    container: document.body
  };

  var errorMessage;

  options = options || {};

  /* Options validation */

  if (!_.isObject(options)) {
    errorMessage = 'options must be an object';
  } else if (options.maxDisplayed && !_.isNumber(options.maxDisplayed)) {
    errorMessage = 'options.maxDisplayed must be an integer';
  } else if (options.displayTimer && !_.isNumber(options.displayTimer)) {
    errorMessage = 'options.displayTimer must be an integer';
  } else if (options.container && !_.isElement(options.container)) {
    errorMessage = 'options.container must be an element';
  } else if (options.position && !_.contains(POSITION_WL, options.position)) {
    errorMessage = 'options.position must be one of the following positions: ' +
                   POSITION_WL.join(', ');
  } else {
    if (keyDifference(options, defaultOptions).length) {
      var optsDiff = keyDifference(options, defaultOptions);
      errorMessage = 'Invalid option passed: ' + optsDiff.join(', ');
    }
  }

  if (errorMessage) {
    return this._throwOrCallback(errorMessage);
  }

  var cleanOptions = _.defaults(options, defaultOptions);

  this._emitter = new Emitter();
  this.ctrl = new NotificationsCtrl(cleanOptions);
  this.ctrl.initialize();
  this._subscriptions = [];

  _.bindAll(this);
}

/**
 * Subscribe to notifications
 *
 * @public
 * @callback {errorCallback}
 */
Notifications.prototype.subscribe = function(rooms, cb) {
  var self = this;

  var errorMessage;

  if (!rooms) {
    errorMessage = 'A room or rooms must be passed';
  } else if (!_.isObject(rooms) && !_.isArray(rooms)) {
    errorMessage = 'Room must be an array of rooms or room object';
  } else if (cb && !_.isFunction(cb)) {
    errorMessage = 'Callback must be a function';
  }

  if (errorMessage) {
    return this._throwOrCallback(errorMessage, cb);
  }

  if (!_.isArray(rooms)) {
    rooms = [rooms];
  }

  var newSubs = [];

  newSubs = _.filter(rooms, function(room) {
    return !_.find(self._subscriptions, { name: room.name });
  });

  try {
    newSubs = _.map(newSubs, function(room){
      return {
        name: room.name,
        channel: room.channel(NOTIFICATION_CHANNEL)
      };
    });
  } catch (e) {
    return this._throwOrCallback('You must have joined the room[\'s] ' +
                                 'before you can subscribe.');
  }

  _.each(newSubs, function(subscription) {
    subscription.channel.on('message', self.ctrl.handler);
  });

  self._subscriptions = _.union(self._subscriptions, newSubs);

  return cb(null, self);
};

/**
 * Unsubscribe to notifications
 *
 * @private
 */
Notifications.prototype.unsubscribe = function(cb) {
  _.each(this._subscriptions, function(subscription) {
    subscription.channel.off('message', this.ctrl.handler);
  }, this);

  return cb(null, this);
};

/**
 * Publish a new status notification to the `room` specified with the given
 * `message` and (optional) message `type`.  Users subscribed to this room
 * will recieve this notification.
 *
 * @public
 * @param {Object} options#room Required platform rooms
 *                 options#message Required notification message
 *                [options#type=info] Notifications type
 *                [options#displayToSelf=false] Display notification to self
 * @param {function} [cb]
 */
Notifications.prototype.publish = function(options, cb) {

  var validTypes = ['info', 'warning', 'error', 'success'];

  var defaultOptions = {
    room: null,
    message: null,
    displayToSelf: false,
    type: 'info'
  };

  var errorMessage;

  /* Options validation */

  if (!_.isUndefined(cb) && !_.isFunction(cb)) {
    errorMessage = 'callback must be a function';
  } else if (!options) {
    errorMessage = 'options must be passed';
  } else if (!_.isPlainObject(options)) {
    errorMessage = 'options must be an object';
  } else if (!options.room) {
    errorMessage = 'options.room must be passed';
  } else if (!options.message) {
    errorMessage = 'options.message must be passed';
  } else if (!_.isString(options.message)) {
    errorMessage = 'options.message must be a string';
  } else if (!_.isObject(options.room)) {
    errorMessage = 'options.room must be an object';
  } else if (options.displayToSelf && !_.isBoolean(options.displayToSelf)) {
    errorMessage = 'options.displayToSelf must be a boolean';
  } else if (options.type && !_.contains(validTypes, options.type)) {
    validTypes = validTypes.join(', ');
    errorMessage = 'options.type must be one of the following: ' + validTypes;
  } else {
    if (keyDifference(options, defaultOptions).length) {
      var optsDiff = keyDifference(options, defaultOptions);
      errorMessage = 'Invalid option passed: ' + optsDiff.join(', ');
    }
  }

  if (errorMessage) {
    return this._throwOrCallback(errorMessage, cb);
  }

  var cleanOptions = _.defaults(options, defaultOptions);

  var channel;

  try {
    channel = cleanOptions.room.channel(NOTIFICATION_CHANNEL);
  } catch (e) {
    this._throwOrCallback('You must have joined the room' +
                          'before you can publish to it');
  }

  var notification = _.pick(cleanOptions, ['type', 'message']);
  var self = this;

  channel.message(notification, function(err, n, context) {
    if (err) {
      return self._throwOrCallback(err, cb);
    }

    if (cleanOptions.displayToSelf) {
      self.ctrl.handler(notification);  // implementation trickies
    }

    if (cb) {
      cb(null, n, context);
    }
  });
};

/**
 * Stop listening to channels, remove the ctrl and ignore local
 * notifications.
 *
 * @public
 * @see Notifications#unsubscribe()
 */
Notifications.prototype.destroy = function(cb) {
  cb = cb || function(){};

  if (!_.isFunction(cb)) {
    this._throwOrCallback('callback must be a function');
  }

  this.ctrl.destroy();
  this.unsubscribe(cb);
};

Notifications.prototype._throwOrCallback = function(err, cb) {

  if (cb && _.isFunction(cb)) {
    cb(new Error(err));
  } else {
    throw new Error(err);
  }

};

/* Module helpers */

function keyDifference(options, defaultOptions) {
  return _.difference(_.keys(options), _.keys(defaultOptions));
}
