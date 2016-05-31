"use strict";

define([],
    function() {

    /*
    * @singleton @constructor
    *
    * Helper class for asserting data types. Should be used as a chain.
        Examples:
            Assert.typeOf(myArg).isString();
            Assert.instanceOf(myArg).is();
    */
    function Assert() {
        var self = this;

        /*
        * @constructor @chain
        *
        * Used as part of chain when doing an assertion. This has methods for checking if data is/isn't
            of a certain type
        *
        * @param {*} data - The data to check the type of.
        */
        function TypeOfAssertion(data) {
            var self = this;

            /*
            * @public
            *
            * Checks if the data is of a certain type
            *
            * @param {String} dataType - The type of data we are expecting the data to be.
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.is = function(dataType) {
                var newDataTypes = ['integer', 'number', 'array'];
                if (dataType === 'integer' && (isNaN(data) || data === null || (!isNaN(data) && data % 1 !== 0))) {
                    return false;
                } else if (dataType === 'number' && isNaN(data)) {
                    return false;
                } else if (dataType === 'array' && (typeof data === 'undefined' || (!data.push && typeof data.length === 'undefined') || typeof data === 'string')) {
                    return false;
                } else if (dataType === 'object' && data === null) {
                    return false;
                } else if (newDataTypes.indexOf(dataType) === -1 && typeof data !== dataType) {
                    return false;
                }
                return true;
            };
            /*
            * @public
            *
            * Checks if the data is not of a certain type
            *
            * @param {String} dataType - The type of data we are expecting the data to not be.
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNot = function(dataType) {
                return !self.is(dataType);
            };

            /*
            * @public
            *
            * Checks if the data is a string.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isString = function() {
                return self.is('string');
            };
            /*
            * @public
            *
            * Checks if the data is not a string.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotString = function() {
                return !self.isString();
            };
            /*
            * @public
            *
            * Checks if the data is a boolean.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isBoolean = function() {
                return self.is('boolean');
            };
            /*
            * @public
            *
            * Checks if the data is not a boolean.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotBoolean = function() {
                return !self.isBoolean();
            };
            /*
            * @public
            *
            * Checks if the data is an object.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isObject = function() {
                return self.is('object');
            };
            /*
            * @public
            *
            * Checks if the data is not an object.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotObject = function() {
                return !self.isObject();
            };
            /*
            * @public
            *
            * Checks if the data is undefined.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isUndefined = function() {
                return self.is('undefined');
            };
            /*
            * @public
            *
            * Checks if the data is not undefined.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotUndefined = function() {
                return !self.isUndefined();
            };
            /*
            * @public
            *
            * Checks if the data is an array.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isArray = function() {
                return self.is('array');
            };
            /*
            * @public
            *
            * Checks if the data is not an array.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotArray = function() {
                return !self.isArray();
            };
            /*
            * @public
            *
            * Checks if the data is an function.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isFunction = function() {
                return self.is('function');
            };
            /*
            * @public
            *
            * Checks if the data is not an function.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotFunction = function() {
                return !self.isFunction();
            };
            /*
            * @public
            *
            * Checks if the data is an integer.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isInteger = function() {
                return self.is('integer');
            };
            /*
            * @public
            *
            * Checks if the data is not an integer.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotInteger= function() {
                return !self.isInteger();
            };
            /*
            * @public
            *
            * Checks if the data is an number.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNumber = function() {
                return self.is('number');
            };
            /*
            * @public
            *
            * Checks if the data is not an number.
            *
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNotNumber = function() {
                return !self.isNumber();
            };
        }

        /*
        * @constructor @chain
        *
        * Used as part of chain when doing an assertion. This has methods for checking if data is/isn't
            an instance of a certain class.
        *
        * @param {*} data - The data to check the instance of.
        */
        function InstanceOfAssertion(data) {
            var self = this;

            /*
            * @public
            *
            * Checks if the data is an instance of a certain class.
            *
            * @param {String} InstanceClass - The class we are excepting the data to be an instance of.
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.is = function(InstanceClass) {
                if (!(data instanceof InstanceClass)) {
                    return false;
                }
                return true;
            };

            /*
            * @public
            *
            * Checks if the data is not an instance of a certain class.
            *
            * @param {String} InstanceClass - The class we are excepting the data to not be an instance of.
            * @return {Boolean} correctAssertion - If the assertion was indeed correct.
            */
            self.isNot = function(dataType) {
                return !self.is(dataType);
            };
        }

        /*
        * @public
        *
        * Used as part of chain when doing an assertion. Checks some data is/isn't of a certain type.
            Assert.typeOf(myArg).isString();
        *
        * @param {*} data - The data to check the type of.
        * @return {TypeOfAssertion} typeOfAssertion - A new instance of the TypeOfAssertion class to be used as a chain.
        */
        self.typeOf = function(data) {
            return new TypeOfAssertion(data);
        };

        /*
        * @public
        *
        * Used as part of chain when doing an assertion. Checks some data is/isn't of an instance of a certain class.
            Assert.typeOf(myArg).isString();
        *
        * @param {*} data - The data to check the instance of.
        * @return {InstanceOfAssertion} instanceOfAssertion - A new instance of the InstanceOfAssertion class to be used as a chain.
        */
        self.instanceOf = function(data) {
            return new InstanceOfAssertion(data);
        };
    }

    return new Assert(); //return a Singleton;

});


