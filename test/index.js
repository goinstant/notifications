/*jshint browser:true, node:false*/
/*global require, assert, sinon*/

describe('Status Notification Component', function() {

  'use strict';

  var Emitter = require('component-emitter');
  var $ = require('jquery');
  var _ = require('lodash');
  var Notifications = require('notifications');

  describe('Notifications.constructor', function() {

    it('returns a new notifications instance', function() {
      var notifications = new Notifications();
      assert.instanceOf(notifications, Notifications);
    });

    it('throws if passed an invalid option', function() {
      var notifications;
      assert.exception(function() {
        notifications = new Notifications({foo: 'bar'});
      }, 'Invalid option passed: foo');
    });

    it('throws if passed an invalid displayTimer', function() {
      var notifications;
      assert.exception(function() {
        notifications = new Notifications({displayTimer: 'bar'});
      }, 'options.displayTimer must be an integer');
    });

    it('throws if passed an invalid maxDisplayed', function() {
      var notifications;
      assert.exception(function() {
        notifications = new Notifications({maxDisplayed: 'bar'});
      }, 'options.maxDisplayed must be an integer');
    });

    it('throws if passed an invalid container', function() {
      var notifications;
      assert.exception(function() {
        notifications = new Notifications({container: 'bar'});
      }, 'options.container must be an element');
    });

    it('throws if passed an invalid position', function() {
      var notifications;
      assert.exception(function() {
        notifications = new Notifications({position: 'bar'});
      }, 'options.position must be one of the following positions: top,' +
         ' top-right, top-left, bottom, bottom-right, bottom-left');
    });

  });

  describe('Notifications Subscribe and Publish', function() {

    var containerClass = '.gi-notify-container';
    var positionClass = 'gi-notify-bottom-right';
    var notificationClass = '.gi-notify';
    var fakeRoom;
    var fakeChannel;
    var notifications;
    var ctrl;

    beforeEach(function() {
      fakeChannel = new Emitter();

      fakeChannel.message = function(message) {
        this.emit('message', message);
      };

      fakeChannel.on = sinon.stub();
      fakeChannel.off = sinon.stub();
      fakeChannel.message = sinon.stub().callsArg(1);

      fakeRoom = {};

      fakeRoom.channel = function() {
        return fakeChannel;
      };

      notifications = new Notifications();
      ctrl = notifications.ctrl;

    });

    afterEach(function() {
      notifications.destroy();
    });

    describe('Notifications.subscribe', function() {

      it('subscribes the controller handler to the channel', function(done) {
        notifications.subscribe(fakeRoom, function(err) {
          assert.ifError(err);

          sinon.assert.calledWith(fakeChannel.on, 'message', ctrl.handler);
          done();
        });
      });

      it('does not subscribe to the same room twice', function(done) {
        notifications.subscribe(fakeRoom, function(err) {
          assert.ifError(err);

          sinon.assert.calledWith(fakeChannel.on, 'message', ctrl.handler);

          notifications.subscribe(fakeRoom, function(err) {
            assert.ifError(err);

            sinon.assert.calledOnce(fakeChannel.on, 'message', ctrl.handler);
            done();
          });
        });
      });

      // it('does not create a race condition if done sync..', function(done) {

      it('throws if not passed a room', function() {
        assert.exception(function() {
          notifications.subscribe();
        }, 'A room or rooms must be passed');
      });

      it('throws if passed an invalid room', function() {
        assert.exception(function() {
          notifications.subscribe('foo');
        }, 'Room must be an array of rooms or room object');
      });

      it('throws if passed an invalid callback', function() {
        assert.exception(function() {
          notifications.subscribe([], 'foo');
        }, 'Callback must be a function');
      });

    });

    describe('Notifications.unsubscribe', function() {

      it('removes listeners when unsubscribed', function(done) {
        notifications.subscribe(fakeRoom, function(err) {
          assert.ifError(err);

          notifications.unsubscribe(function(err) {
            assert.ifError(err);

            sinon.assert.calledWith(fakeChannel.off, 'message', ctrl.handler);
            done();
          });
        });
      });

    });

    describe('Notifications.publish', function() {

      it('publishes notifications', function(done) {
        notifications.publish({
          room: fakeRoom,
          message: 'blah'
        }, function(err) {
          assert.ifError(err);

          sinon.assert.calledWith(fakeChannel.message, {
            type: 'info', message: 'blah'
          });
          done();
        });
      });

      it('works without a callback', function() {
        notifications.publish({
          room: fakeRoom,
          message: 'blah'
        });
        sinon.assert.called(fakeChannel.message);
      });

      it('throws if not provided a valid callback', function() {
        assert.exception(function() {
          notifications.publish({}, 'foo');
        },'callback must be a function');
      });

      it('throws if not passed options', function(done) {
        notifications.publish(false, function(err) {
           assert.equal(err.message, 'options must be passed');
           done();
        });
      });

      it('throws if passed invalid options', function(done) {
        notifications.publish({
          room: fakeRoom,
          foo: 'bar',
          message: 'foo'
        }, function(err) {
           assert.equal(err.message, 'Invalid option passed: foo');
           done();
        });
      });


      it('throws if not passed a room', function(done) {
        notifications.publish({
          message: 'foo'
        }, function(err) {
           assert.equal(err.message, 'options.room must be passed');
           done();
        });
      });

      it('throws if not passed a valid room', function(done) {
        notifications.publish({
          room: 'dfdf',
          message: 'foo'
        }, function(err) {
           assert.equal(err.message, 'options.room must be an object');
           done();
        });
      });

      it('throws if not passed a message', function(done) {
        notifications.publish({
          room: fakeRoom
        }, function(err) {
           assert.equal(err.message, 'options.message must be passed');
           done();
        });
      });

      it('throws if not passed a valid message', function(done) {
        notifications.publish({
          message: {},
          room: fakeRoom
        }, function(err) {
           assert.equal(err.message, 'options.message must be a string');
           done();
        });
      });

      it('throws if not passed a valid displayToSelf option', function(done) {
        notifications.publish({
          message: 'foo',
          room: fakeRoom,
          displayToSelf: 'foo'
        }, function(err) {
           assert.equal(err.message, 'options.displayToSelf must be a boolean');
           done();
        });
      });

      it('throws if not passed a valid type', function(done) {
        notifications.publish({
          message: 'foo',
          room: fakeRoom,
          type: 'foo'
        }, function(err) {
          var msg = 'options.type must be one of the following: info, ' +
                    'warning, error, success';
          assert.equal(err.message, msg);
          done();
        });
      });

    });

    describe('Notifications Controller and View' , function() {
      var notifications;
      var ctrl;

      // Cross browser event trigger
      function fireEvent(obj, evt) {
        var fireOnThis = obj;
        var evObj;

        if (!document.createEvent) {
          evObj = document.createEventObject();
          fireOnThis.fireEvent( 'on' + evt, evObj );
        } else {
          evObj = document.createEvent('MouseEvents');
          evObj.initEvent( evt, true, false );
          fireOnThis.dispatchEvent( evObj );
        }
      }

      beforeEach(function() {
        notifications = new Notifications({
          displayTimer: 200,
          position: 'bottom-right'
        });

        ctrl = notifications.ctrl;
      });

      afterEach(function() {
        notifications.destroy();
      });

      it('displays a notification', function() {
        ctrl.handler({message: 'Foo', type: 'info'});
        var list = $(containerClass).find(notificationClass);
        assert.equal(list.length, 1);
      });

      it('displays the correct number of notifications', function() {
        _.times(3, function() {
          ctrl.handler({message: 'Foo', type: 'info'});
        });

        var list = $(containerClass).find(notificationClass);

        assert.equal(list.length, 3);
      });


      it('displays no more than the specified maximum', function() {
        _.times(5, function() {
          ctrl.handler({message: 'Foo', type: 'info'});
        });

        var list = $(containerClass).find(notificationClass);
        assert.equal(list.length, 3);
      });

      it('displays a notification for the correct duration', function(done) {
        ctrl.handler({ message: 'Foo', type: 'info' });

        var list = $(containerClass).find(notificationClass);
        assert.equal(list.length, 1);

        _.delay(function() {
          var list = $(containerClass).find(notificationClass);
          assert.equal(list.length, 0);
          done();
        }, 200);
      });

      it('displays a notification in the correct position', function() {
        ctrl.handler({ message: 'Foo', type: 'info' });
        assert($(containerClass).hasClass(positionClass));
      });

      it('Queues surplus notifications', function(done) {
        _.times(4, function() {
          ctrl.handler({ message: 'Foo', type: 'info' });
        });

        var list = $(containerClass).find(notificationClass);
        assert.equal(list.length, 3);

        _.delay(function() {
          var list = $(containerClass).find(notificationClass);
          assert.equal(list.length, 1);
          done();
        }, 200);
      });

      it('Removes the container once destroyed', function() {
        notifications.destroy();
        var list = $(containerClass);
        assert.equal(list.length, 0);
      });

      it('Removes the notification if its closed', function() {
        ctrl.handler({message: 'Foo', type: 'info'});

        var list = $(containerClass).find(notificationClass);
        assert.equal(list.length, 1);

        ctrl._activeNotifications[0].remove();

        var list2 = $(containerClass).find(notificationClass);
        assert.equal(list2.length, 0);
      });

      it('Removes the container when all notifications are gone', function() {
        ctrl.handler({message: 'Foo', type: 'info' });
        ctrl.handler({message: 'Foo2', type: 'info' });
        assert.equal($(containerClass).length, 1);

        ctrl._activeNotifications[0].remove();
        assert.equal($(containerClass).length, 1);

        ctrl._activeNotifications[0].remove();
        assert.equal($(containerClass).length, 0);
      });

      it('continues to display a notification on hover', function(done) {

        ctrl.handler({message: 'Foo', type: 'info'});

        var $notification = $(containerClass).find(notificationClass);

        fireEvent($notification.get(0), 'mouseover');

        _.delay(function() {
          assert.equal($(containerClass).find(notificationClass).length, 1);
          done();
        }, 250);
      });

      it('remove the notification after hover', function(done) {

        ctrl.handler({message: 'Foo', type: 'info'});

        var $notification = $(containerClass).find(notificationClass);

        fireEvent($notification.get(0), 'mouseover');

        _.delay(function() {
          assert.equal($(containerClass).find(notificationClass).length, 1);
          fireEvent($notification.get(0), 'mouseout');
          assert.equal($(containerClass).find(notificationClass).length, 0);
          done();
        }, 250);
      });

      it('places the notifications in the options container', function() {
        var $el = $('<div></div').addClass('.testContainer');

        $('body').append($el);

        var notifications2 = new Notifications({
          displayTimer: 200,
          container: $el.get(0)
        });

        notifications2.ctrl.handler({message: 'Foo', type: 'info'});

        var results = $el.find(notificationClass);
        assert.equal(results.length, 1);
      });

    });

  });

});
