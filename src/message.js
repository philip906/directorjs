"use strict";

define([
    'underscore'],
    function(
        _) {

    /*
    * @singleton
    *
    * Helper class for managing messages.
    */
    function Message() {
        var self = this;

        var _messageSwitch = function(msg, messageId, callback) {
            var msgParts = msg.data.split('::');
            if (msgParts[0] === messageId) {
                return callback(msgParts[1]);
            }
        };

        self.addWatcher = function(messageId, callback) {
            window.addEventListener("message", function(event) {
                return _messageSwitch(event, messageId, callback);
            });
        };

        self.postMessageToTop = function(msg) {
            window.top.postMessage(msg, "*");
        };

        self.postMessageToIframe = function(iframeId, msg) {
            document.getElementById(iframeId).contentWindow.postMessage(msg, "*");
        };
    }

    return new Message(); //Return a Singleton

});