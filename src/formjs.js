/*!
 * formjs javascript library v0.1.0
 *
 * Copyright 2012, Sebastian Widelak
 * Licensed under unknown licence
 *
 * Javascript library for create and manage forms.
 *
 * Date:
 */
(function (window, define){
    if(typeof window.formjs != 'undefined'){
        throw 'variable formjs is defined already';
    }
    define('formjs', function(require, exports) {
        /**
         * Provide some compatibility for older browsers
         */
        if (!Array.prototype.indexOf) {
            /**
             * Find position of object in array
             * @param obj
             * @param fromIndex
             * @return {*}
             */
            Array.prototype.indexOf = function (obj, fromIndex) {
                var me = this;
                if (fromIndex == null) {
                    fromIndex = 0;
                } else if (fromIndex < 0) {
                    fromIndex = Math.max(0, me.length + fromIndex);
                }
                for (var i = fromIndex, j = me.length; i < j; i++) {
                    if (this[i] === obj)
                        return i;
                }
                return -1;
            };
        }
        /**
         * Walk through each array record
         */
        if (!Array.prototype.forEach) {
            /**
             *
             * @param obj
             * @param iterator
             * @param context
             */
            Array.prototype.forEach = function (obj, iterator, context) {
                var breaker = {};
                if (obj == null) return;
                if (obj.length === +obj.length) {
                    for (var i = 0, l = obj.length; i < l; i++) {
                        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
                    }
                } else {
                    for (var key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            if (iterator.call(context, obj[key], key, obj) === breaker) return;
                        }
                    }
                }
            };
        }

        var formjs,
            elementsWithName,
            objRef,
            elProp,
            elIdArr,
            events,
            validator;

        /**
         * Left trim
         * @param {String} str
         * @param {String} chars Optional chars
         * @return {String}
         */
        function ltrim(str, chars) {
            chars = chars || "\\s";
            return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
        }

        /**
         * Right trim
         * @param {String} str
         * @param {String} chars Optional chars
         * @return {String}
         */
        function rtrim(str, chars) {
            chars = chars || "\\s";
            return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
        }

        /**
         * Trim both sides
         * @param {String} str
         * @param {String} chars Optional chars
         * @return {String}
         */
        function trim(str, chars) {
            return ltrim(rtrim(str, chars), chars);
        }


        /**
         *
         * Check that passed value is in array
         *
         * @param {Array} arr
         * @param {Object} obj
         * @return {Boolean}
         */
        function include(arr, obj) {
            return (arr.indexOf(obj) != -1);
        }

        /**
         * Library object
         * */

        /**
         * @namespace
         */
        formjs = exports;

        /**
         *
         * @type {String}
         */
        formjs.version = '0.1.0';

        /**
         *
         * @type {String}
         */
        formjs.name = 'formjs';

        /**
         * Current library path
         * @type {String}
         * @private
         */
        formjs._path = (function () {
            var scripts = document.getElementsByTagName('script'), pathArr;
            for (var index in scripts) {
                if (scripts[index].src && ~scripts[index].src.indexOf(formjs.name)) {
                    pathArr = scripts[index].src.split("/")
                    pathArr.splice(pathArr.length - 1, 1);
                    return pathArr.join("/");
                }
            }
            return null;
        })();

        /**
         *
         * @namespace
         * @type {Object}
         */
        elIdArr = {};

        /**
         *
         * @namespace
         * @type {Object}
         */
        objRef = {};
        /**
         *
         * @namespace
         * @type {Object}
         */
        elProp = {
            text:function (el, text) {
                el.setText(text);
            }
        };

        /**
         *
         * @namespace
         * @type {Object}
         */
        events = {
            click:function (el, callback) {
                el.html.onclick = function (ev) {
                    return callback.call(this, el, ev);
                }
            },
            change:function (el, callback) {
                el.html.onchange = function (ev) {
                    return callback.call(this, el, ev);
                }
            },
            keyup:function (el, callback) {
                el.html.onkeyup = function (ev) {
                    try {
                        return callback.call(el, this, ev);
                    } catch (e) {
                        console.log(e);
                    }
                }
            }

        };

        /**
         * @namespace validator
         * @type {Object}
         */
        validator = {
            /**
             *
             * @param {String} value
             * @constructor
             */
            alnum:function (value) {
                var me = this;
                me.errAr = [];
                me.allowWhiteSpace = value;
            }, //v
            /**
             *
             * @param {String} value
             */
            alpha:function (value) {
                var me = this;
                me.allowWhiteSpace = value;
                me.errAr = [];
            }, //v
            beetween:function () {
                var me = this;
                me.errAr = [];
            },
            date:function () {
                var me = this;
                me.errAr = [];
            },
            emailAddress:function () {
                var me = this;
                me.errAr = [];
            }, //v
            /**
             *
             * @param {String} value
             */
            'float':function (value) {
                var me = this;
                me.errAr = [];
                me.allowWhiteSpace = value;
            },
            /**
             *
             * @param {String} value
             */
            greaterThan:function (value) {
                var me = this;
                me.errAr = [];
                me.greaterThan = value;
            },
            /**
             *
             * @param {Array} array
             */
            inArray:function (array) {
                var me = this;
                me.errAr = [];
                me.array = array;
            },
            notEmpty:function () {
                var me = this;
                me.errAr = [];
            },
            /**
             *
             * @param {String} regionCode
             */
            postCode:function (regionCode) {
                var me = this;
                me.errAr = [];
                me.regionCode = regionCode;
            },
            numb:function () {
                var me = this;
                me.errAr = [];
            }, //v
            /**
             *
             * @param {String} value
             */
            documentFilenames:function (value) {
                var me = this;
                me.errAr = [];
                me.allowWhiteSpace = value;
            }, //v
            /**
             * @const
             */
            error:{
                /**
                 * @const
                 */
                NOT_A_NUMBER:'NOT_A_NUMBER',
                /**
                 * @const
                 */
                NOT_A_ALPHA:'NOT_A_ALPHA',
                /**
                 * @const
                 */
                NOT_A_ALPHA_OR_NUMBER:'NOT_A_ALPHA_OR_NUMBER',
                /**
                 * @const
                 */
                WRONG_EMAIL_FORMAT:'WRONG_EMAIL_FORMAT',
                /**
                 * @const
                 */
                WRONG_DOCUMENT_FORMAT:'WRONG_DOCUMENT_FORMAT',
                /**
                 * @const
                 */
                INSERTED_VALUE_DOES_NOT_FIT_THE_CONTDITION:'INSERTED_VALUE_DOES_NOT_FIT_THE_CONTDITION'
            }

        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.alnum.prototype.isValid = function (value) {
            var pattern;
            pattern = this.allowWhiteSpace ? /^([\u0041-\u005A\u0061-\u007A\u00C0-\u017F0-9\s])+$/ : /^([\u0041-\u005A\u0061-\u007A\u00C0-\u017F0-9])+$/;
            return pattern.test(value);
        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.numb.prototype.isValid = function (value) {
            return !isNaN(parseFloat(value)) && isFinite(value);
        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.alpha.prototype.isValid = function (value) {

            if (typeof value == 'string') {
                var pattern = this.allowWhiteSpace ? /^([\u0041-\u005A\u0061-\u007A\u00C0-\u017F\s])+$/i : /^([\u0041-\u005A\u0061-\u007A\u00C0-\u017F])+$/i;
                return pattern.test(value);
            }
            return false;

        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.emailAddress.prototype.isValid = function (value) {
            if (typeof value == 'string') {
                var pattern = /^([0-9a-zA-Z]+([_.-]?[0-9a-zA-Z]+)*@[0-9a-zA-Z]+[0-9,a-z,A-Z,.,-]*(.){1}[a-zA-Z]{2,4})+$/i;
                return pattern.test(value);
            }
            return false;
        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.documentFilenames.prototype.isValid = function (value) {
            var pattern = /^[\u0041-\u005A\u0061-\u007A\u00C0-\u017F\-_\.]+\.(pdf|txt|doc|csv)$/i;
            return pattern.test(value);

        };

        /**
         *
         * @param value
         * @return {*}
         */
        validator.notEmpty.prototype.isValid = function (value) {
            return ~value.length;
        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.greaterThan.prototype.isValid = function (value) {
            if (!isNaN(parseFloat(value)) && isFinite(value))
                return !!(parseFloat(value) > parseFloat(this.greaterThan));
            else
                return false;
        };

        /**
         *
         * @param value
         * @return {*}
         */
        validator.date.prototype.isValid = function (value) {
            return ~value.length;
        };

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.postCode.prototype.isValid = function (value) {
            var xhttp,
                xmlDoc;
            if (window.XMLHttpRequest) {
                xhttp = new XMLHttpRequest();
            }
            else // IE 5/6
            {
                xhttp = new ActiveXObject("Microsoft.XMLHTTP");
            }
            xhttp.open("GET", formjs.path + "/Data/postalCodeData.xml", false);
            xhttp.send();
            xmlDoc = xhttp.responseXML;
            var elements = xmlDoc.getElementsByTagName('postCodeRegex');
            for (var index in elements) {
                if (elements[index].getAttribute && elements[index].getAttribute('territoryId') == this.regionCode) {
                    var regexp = new RegExp(elements[index].textContent, "i");
                    return regexp.test(value);
                }
            }
            return false;
        }

        /**
         *
         * @param value
         * @return {Boolean}
         */
        validator.notEmpty.prototype.isValid = function (value) {
            return !!trim(value).length;
        };

        /**
         *
         * @constructor
         */
        function Form() {
            var me = this;
            /**
             * formjs elements array
             * @type {Array}
             * @private
             */
            me._elArr = [];
            /**
             *
             * formjs elements array
             * @type {Array}
             * @private
             */
            me._attr = [];
            /**
             *
             * @type {Array}
             * @private
             */
            me._fieldRef = [];
            /**
             * formjs element name
             *
             * @type {Array}
             * @private
             */
            me._elName = 'form';
            /**
             * formjs html object
             * @type {Array}
             * @private
             */
            me.html = document.createElement('form');
            // assign arguments to proper vaiables
            me.valArg(arguments);
            //applaying default attributes
            if (me._parent)
                me._parent.setEl(me);
            me.defaultAttr();
            //applaying default classes
            me.defaultClasses();
            //settings attributes for elements
            me.setAttr(me._attr);
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;
        }

        /**
         * @constructor
         */
        function Wrapper () {
            var me = this;
            /**
             * formjs elements array
             *
             * @api public
             */
            me._elArr = [];
            /**
             * formjs elements array
             *
             * @api public
             */
            me._attr = [];
            /**
             * formjs element name
             *
             * @api public
             */
            me._elName = 'wrapper';
            me.html = document.createElement('div');
            // assign arguments to proper variables
            me.valArg(arguments);
            // setting elements attributes
            me.setAttr(me._attr);
            //apply default attributes
            if (me._parent)
                me._parent.setEl(me);
            me.defaultAttr();
            //applying default classes
            me.defaultClasses();
            //register in global object
            elIdArr[me._id] = me.html;
            objRef[me.id] = me;
            var tmp = me;

        }

        /**
         * formjs textfield object
         * @constructor
         * @api Public
         */
        function Textfield() {
            var me = this;

            /**
             * formjs element name
             *
             * @api public
             */
            me._elName = 'textfield';
            /**
             * formjs elements array
             *
             * @api public
             */
            me._attr = [];
            me.validators = [];
            me.html = document.createElement('input');
            me.valArg(arguments, true);
            //applaying default attributes
            me.defaultAttr();
            //applaying default classes
            me.defaultClasses();
            me.setAttr(me._attr);
            //connectiong parent with children
            me._parent.setEl(me);
            //register in global object
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;
            var tmp = me.parent();
            while (tmp){
                if (tmp._elName == 'form'){
                    tmp._fieldRef.push(me);
                    return;
                }else if(typeof me.parent()  == 'undefined'){
                    return;
                }else
                    tmp = tmp.parent();
            }

        }

        /**
         * formjs password object
         * @constructor
         * @api public
         */
        function Password() {
            var me = this;

            /**
             * formjs element name
             *
             * @api public
             */
            me._elName = 'password';
            /**
             * formjs elements array
             *
             * @api public
             */
            me._attr = [],
                me.validators = [],
                me.html = document.createElement('input');

            me.valArg(arguments, true);
            //applaying default attributes
            me.defaultAttr();
            //applaying default classes
            me.defaultClasses();
            me.setAttr(me._attr);
            //connectiong parent with children
            me._parent.setEl(me);
            //register in global object
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;
            var tmp = me.parent();
            while (tmp){
                if (tmp._elName == 'form'){
                    tmp._fieldRef.push(me);
                    return;
                }else if(typeof me.parent()  == 'undefined'){
                    return;
                }else
                    tmp = tmp.parent();
            }
        }

        /**
         *
         * @constructor
         */
        function Label() {
            var me = this;

            /**
             * formjs elements array
             *
             * @api public
             */
            me._elArr = [],
            /**
             * formjs elements array
             *
             * @api public
             */
                me._attr = [],
            /**
             * formjs element name
             *
             * @api public
             */
                me._elName = 'label',
                me.html = document.createElement('label');
            // assiging passed arguments to variables
            me.valArg(arguments);
            //applaying default attributes
            if (me._parent)
                me._parent.setEl(me);
            me.defaultAttr();
            //applaying default classes
            me.defaultClasses();
            //register in global object
            if (me._attr && typeof me._attr == 'object') {
                me.setAttr(me._attr);
            }
            //register in global object
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;

        }

        /**
         *
         * @constructor
         */
        function Textarea() {
            var me = this;
            /**
             * formjs element name
             *
             * @api public
             */
            me._elName = 'textarea';
            /**
             * formjs elements array
             *
             * @api public
             */
            me._attr = [];
            me.validators = [];
            me.html = document.createElement('textarea');
            me.valArg(arguments, true);
            //applaying default attributes
            me.defaultAttr();
            //applaying default classes
            me.defaultClasses();
            me.setAttr(me._attr);
            //connectiong parent with children
            me._parent.setEl(me);
            //register in global object
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;
            var tmp = me.parent();
            while (tmp){
                if (tmp._elName == 'form'){
                    tmp._fieldRef.push(me);
                    return;
                }else if(typeof me.parent()  == 'undefined'){
                    return;
                }else
                    tmp = tmp.parent();
            }
        }

        /**
         *
         * @constructor
         */
        function Select() {

        }

        /**
         *
         * @constructor
         */
        function Submit() {
            var me = this;
            /**
             * formjs element name
             *
             * @api public
             */
            me._elName = 'submit';
            /**
             * formjs elements array
             *
             * @api public
             */
            me._attr = [],
                me.html = document.createElement('input');

            me.valArg(arguments, true);
            /**
             * applaying default attributes
             */
            me.defaultAttr();
            /**
             * applaying default classes
             */
            me.defaultClasses();
            /**
             * connecting parent with children
             *
             */
            me.setAttr(me._attr);
            me._parent.setEl(me);
            /**
             * register in global object
             */
            elIdArr[me.id] = me.html;
            objRef[me.id] = me;
            var tmp = me.parent();
        }

        var fMethods;
        fMethods = {

            /**
             * return attributes
             *
             * @api public
             */
            attr:function () {
                var me = this,
                    i;
                if (!arguments.length)
                    return me._attr
                else {
                    var temp = [];
                    for (i = 0; i < arguments.length; i++)
                        temp.push(me._attr[arguments[i]])
                    return temp;
                }
            },
            children:function (id) {
                var me = this,
                    key;
                if (typeof id == 'number') {
                    for (key in me._elArr) {
                        if (!id)
                            return me._elArr[key];
                        else return null;
                    }
                } else {
                    var el = me.getEl(id);
                    if (el)
                        return el;
                    else
                        return null;
                }
            },
            defaultAttr:function () {
                var me = this,
                    key;
                for (key in formjs._cfg.attributes[me._elName]) {
                    me.html.setAttribute(key, formjs._cfg.attributes[me._elName][key])
                    me._attr[key] = formjs._cfg.attributes[me._elName][key];
                }
            },
            defaultClasses:function () {
                var me = this,
                    key;
                for (key in formjs._cfg.classes[me._elName]) {
                    if (!me.hasClass(formjs._cfg.classes[me._elName][key]))
                        me.html.setAttribute('class', (me.html.getAttribute('class') == null ? '' : me.html.getAttribute('class')) + ' ' + formjs._cfg.classes[me._elName][key]);
                }
            },
            /**
             * get element
             *
             * @api public
             */
            getClasses:function () {
                var me = this;
                return me.html.getAttribute('class');
            },
            getContent: function (){
                var me = this;
                return me.html.innerHTML;
            },
            /**
             * get element
             *
             * @api public
             */
            getEl:function (id) {
                var me = this,
                    el = null,
                    index;
                for (index in me._elArr) {
                    if (el)
                        continue;
                    if (me._elArr[index].id == id) {
                        el = me._elArr[index];
                    }
                    else {
                        if (me._elArr[index]._elArr && me._elArr[index]._elArr.length) {
                            el = me._elArr[index].getEl(id);
                        }
                    }
                }
                return el;
            },
            getName:function () {
                var me = this;
                return me.html.getAttribute('name');
            },
            /**
             * get element
             *
             * @api public
             */
            getValue:function () {
                var me = this;
                return me.html.value;
            },
            /**
             * Check that class already exist
             *
             * @param className
             */
            hasClass:function (className) {
                var me = this;
                if (me.html.getAttribute('class'))
                    return ~me.html.getAttribute('class').indexOf(className);
                else
                    return false;
            },
            /**
             * Check that element has requested style and return value
             *
             * @param style
             */
            hasStyle:function (style) {
                var me = this;
                if (me.html.getAttribute('style') && ~me.html.getAttribute('style').indexOf(style)) {
                    var string = me.html.getAttribute('style').substring(me.html.getAttribute('style').indexOf(style)),
                        array = trim(string).split(";");
                    array = array[0].split(":")
                    return array[1];
                }
                else
                    return null;
            },
            newEl:function (el, id, attr) {
                var me = this;
                try {
                    return new me[el](me, id, attr);
                } catch (e) {
                    throw 'Unrecognized element name';
                }
            },
            /**
             * creat new element
             *
             * @api public
             * @param ev type of events
             * @param callback callback function
             */
            newEv:function (ev, callback) {
                var me = this;
                try {
                    formjs._events[me._elName][ev](me, callback);
                    return me;
                } catch (e) {
                    throw 'Unrecognized event name';
                }
            },
            /**
             * Return parent object
             *
             */
            parent:function () {
                var me = this;
                return me._parent;
            },

            removeClass:function (className) {
                var me = this;
                if (me.hasClass(className))
                    me.html.setAttribute('class', (me.html.getAttribute('class') == null ? '' : (function (html) {
                        var array = html.getAttribute('class').split(" ");
                        if (~array.indexOf(className))
                            array.splice(array.indexOf(className), 1);
                        return array.join(" ");
                    })(me.html)));
            },
            setAttr:function (attrName, attrVal) {
                var me = this;
                if (arguments.length < 2 && typeof arguments[0] == 'object') {
                    for (var key in arguments[0]) {
                        if (elProp[key]) {
                            elProp[key](me, arguments[0][key])
                        } else if (formjs._events[me._elName][key]) {
                            formjs._events[me._elName][key](me, arguments[0][key]);
                        } else {
                            me.html.setAttribute(key, arguments[0][key]);
                        }
                    }
                } else if (arguments.length == 2 && typeof arguments[0] == 'string') {
                    if (elProp[arguments[0]]) {
                        elProp[arguments[0]](me, arguments[1])
                    }else
                        me.html.setAttribute(attrName, attrVal);
                }
                return me;
            },
            /**
             * set element
             *
             * @api public
             */
            setClass:function (className) {
                var me = this;
                if (!me.hasClass(className))
                    me.html.setAttribute('class', (me.html.getAttribute('class') == null ? '' : me.html.getAttribute('class')) + ' ' + className);
                return me;
            },
            /**
             * set element
             *
             * @api public
             */
            setEl:function (el) {
                var me = this;
                me._elArr.push(el);
                me.html.appendChild(el.html);
                el.idInParentArr = me._elArr.length - 1;
                return me;
            },

            /**
             * set element
             *
             * @api public
             */
            setFilter:function (filter) {
                var me = this;
                me.filters.push(filter);
                return me;
            },
            /**
             * set element
             *
             * @api public
             */
            setStyle:function (name, value) {
                var me = this;
                if (me.html.getAttribute('style') && ~me.html.getAttribute('style').indexOf(name)) {
                    var array = trim(me.html.getAttribute('style')).split(";"),
                        newStyle = [];
                    for (var key in array) {
                        var tmp = trim(array[key]).split(":");
                        if (trim(tmp[0]) == name)
                            tmp[1] = value;
                        newStyle.push(tmp[0] + ':' + tmp[1]);
                    }
                    me.html.setAttribute('style', newStyle.join(";"));

                } else if (me.html.getAttribute('style')) {
                    me.html.setAttribute('style', me.html.getAttribute('style') + ';' + name + ':' + 'value')
                } else {
                    me.html.setAttribute('style', name + ':' + value);
                }
                return me;
            },
            /**
             *
             */
            setText:function (text) {
                var me = this;
                me.html.innerHTML = text;
                return me;
            },
            /**
             * set element
             *
             * @api public
             */
            setValidator:function (validator) {
                var me = this;
                me.validators.push(validator);
                return me;
            },
            /**
             * return html dom object
             *
             * @api public
             */
            toHTML:function () {
                var me = this;
                return me.html;
            },
            toJSON:function () {
                var me = this;
                var json = {};
                try {
                    switch (me._elName) {
                        case 'password':
                        case 'textfield':
                        case 'textarea' :
                            json[me.getName()] = me.getValue();
                            break;
                        default :
                            if (me._elArr)
                                me._elArr.forEach(function (element, index, array) {
                                    if (element.toJSON) {
                                        var data = element.toJSON();
                                        for(var key in data)
                                            json[key] = data[key];
                                    }
                                });


                    }
                    return json;
                } catch (e) {
                    console.log(e)
                }
            },
            valArg:function (_arguments, parent) {
                var me = this;
                for (var arg in _arguments) {
                    switch (typeof _arguments[arg]) {
                        case 'object':
                            if (_arguments[arg]._elName)
                                me._parent = _arguments[arg];
                            else
                                for (var key in _arguments[arg])
                                    me._attr[key] = _arguments[arg][key];
                            break;
                        case 'string':
                            me.id = _arguments[arg];
                            me._attr['id'] = me.id;
                            break;
                    }
                    if (formjs._cfg.elementsWithName.indexOf(me._elName) > -1 && !~me._attr.indexOf('name'))
                        me._attr['name'] = me._attr['id'];
                }
                if (!me.id && typeof id == 'string')
                    throw 'Id is required argument and must have specific format';
                if (document.getElementById(me.id))
                    throw 'Element with id: ' + me.id + ' already exits';
                if (parent && !me._parent)
                    throw 'Reference to parent is required';

            },
            validate: function () {
                var _this = this,
                    error = 0;
                switch (this._elName) {
                    case 'form':
                        this._fieldRef.forEach(function (element, index, array){
                            if(!element.validate())
                                error++;
                        });
                        return !!(!error);
                        break;
                    default :
                        this.validators.forEach(function (element, index, array) {
                            try {
                                if (element.isValid(_this.getValue()) == false) {
                                    error++;
                                    _this.setClass('formjs-' + _this._elName + "-invalid");
                                } else {
                                    _this.removeClass('formjs-' + _this._elName + "-invalid");
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        });
                        if (!error)
                            return true;
                        else
                            return false;
                        break;
                }
            }

        };

        //Wrapper methods
        Wrapper.prototype.valArg = fMethods.valArg;
        Wrapper.prototype.setAttr = fMethods.setAttr;
        Wrapper.prototype.newEl = fMethods.newEl;
        Wrapper.prototype.setEl = fMethods.setEl;
        Wrapper.prototype.getEl = fMethods.getEl;
        Wrapper.prototype.toHTML = fMethods.toHTML;
        Wrapper.prototype.parent = fMethods.parent;
        Wrapper.prototype.defaultAttr = fMethods.defaultAttr;
        Wrapper.prototype.getClasses = fMethods.getClasses;
        Wrapper.prototype.defaultClasses = fMethods.defaultClasses;
        Wrapper.prototype.hasClass = fMethods.hasClass;
        Wrapper.prototype.setClass = fMethods.setClass;
        Wrapper.prototype.removeClass = fMethods.removeClass;
        Wrapper.prototype.hasStyle = fMethods.hasStyle;
        Wrapper.prototype.setStyle = fMethods.setStyle;
        Wrapper.prototype.setText = fMethods.setText;
        Wrapper.prototype.toJSON = fMethods.toJSON;

        // form namespace
        Wrapper.prototype.textarea = Textarea;
        Wrapper.prototype.textfield = Textfield;
        Wrapper.prototype.password = Password;
        Wrapper.prototype.label = Label;
        Wrapper.prototype.submit = Submit;
        Wrapper.prototype.wrapper = Wrapper;


        //texarea methods
        Textarea.prototype.valArg = fMethods.valArg;
        Textarea.prototype.setAttr = fMethods.setAttr;
        Textarea.prototype.parent = fMethods.parent;
        Textarea.prototype.defaultAttr = fMethods.defaultAttr;
        Textarea.prototype.getClasses = fMethods.getClasses;
        Textarea.prototype.defaultClasses = fMethods.defaultClasses;
        Textarea.prototype.hasClass = fMethods.hasClass;
        Textarea.prototype.setClass = fMethods.setClass;
        Textarea.prototype.hasStyle = fMethods.hasStyle;
        Textarea.prototype.setStyle = fMethods.setStyle;
        Textarea.prototype.setValidator = fMethods.setValidator;
        Textarea.prototype.getName = fMethods.getName;
        Textarea.prototype.getValue = fMethods.getValue;
        Textarea.prototype.toJSON = fMethods.toJSON;
        Textarea.prototype.validate = fMethods.validate;

        // textfield methods
        Textfield.prototype.valArg = fMethods.valArg;
        Textfield.prototype.setAttr = fMethods.setAttr;
        Textfield.prototype.parent = fMethods.parent;
        Textfield.prototype.defaultAttr = fMethods.defaultAttr;
        Textfield.prototype.getClasses = fMethods.getClasses;
        Textfield.prototype.getValue = fMethods.getValue;
        Textfield.prototype.defaultClasses = fMethods.defaultClasses;
        Textfield.prototype.hasClass = fMethods.hasClass;
        Textfield.prototype.setClass = fMethods.setClass;
        Textfield.prototype.removeClass = fMethods.removeClass;
        Textfield.prototype.hasStyle = fMethods.hasStyle;
        Textfield.prototype.setStyle = fMethods.setStyle;
        Textfield.prototype.setFilter = fMethods.setFilter;
        Textfield.prototype.setValidator = fMethods.setValidator;
        Textfield.prototype.validate = fMethods.validate;
        Textfield.prototype.newEv = fMethods.newEv;
        Textfield.prototype.toJSON = fMethods.toJSON;
        Textfield.prototype.getName = fMethods.getName;

        // password methods
        Password.prototype.valArg = fMethods.valArg;
        Password.prototype.setAttr = fMethods.setAttr;
        Password.prototype.parent = fMethods.parent;
        Password.prototype.getClasses = fMethods.getClasses;
        Password.prototype.defaultClasses = fMethods.defaultClasses;
        Password.prototype.removeClass = fMethods.removeClass;
        Password.prototype.defaultAttr = fMethods.defaultAttr;
        Password.prototype.hasClass = fMethods.hasClass;
        Password.prototype.setClass = fMethods.setClass;
        Password.prototype.hasStyle = fMethods.hasStyle;
        Password.prototype.setStyle = fMethods.setStyle;
        Password.prototype.setFilter = fMethods.setFilter;
        Password.prototype.setValidator = fMethods.setValidator;
        Password.prototype.validate = fMethods.validate;
        Password.prototype.toJSON = fMethods.toJSON;
        Password.prototype.getName = fMethods.getName;
        Password.prototype.getValue = fMethods.getValue;

        // submit methods
        Submit.prototype.valArg = fMethods.valArg;
        Submit.prototype.setAttr = fMethods.setAttr;
        Submit.prototype.parent = fMethods.parent;
        Submit.prototype.newEv = fMethods.newEv;
        Submit.prototype.defaultAttr = fMethods.defaultAttr;
        Submit.prototype.getClasses = fMethods.getClasses;
        Submit.prototype.setClass = fMethods.setClass;
        Submit.prototype.defaultClasses = fMethods.defaultClasses;
        Submit.prototype.hasClass = fMethods.hasClass;
        Submit.prototype.hasStyle = fMethods.hasStyle;
        Submit.prototype.setStyle = fMethods.setStyle;

        //form method
        Form.prototype.valArg = fMethods.valArg;
        Form.prototype.newEl = fMethods.newEl;
        Form.prototype.setEl = fMethods.setEl;
        Form.prototype.getEl = fMethods.getEl;
        Form.prototype.toHTML = fMethods.toHTML;
        Form.prototype.attr = fMethods.attr;
        Form.prototype.setAttr = fMethods.setAttr;
        Form.prototype.parent = fMethods.parent;
        Form.prototype.getClasses = fMethods.getClasses;
        Form.prototype.defaultClasses = fMethods.defaultClasses;
        Form.prototype.defaultAttr = fMethods.defaultAttr;
        Form.prototype.hasClass = fMethods.hasClass;
        Form.prototype.setClass = fMethods.setClass;
        Form.prototype.hasStyle = fMethods.hasStyle;
        Form.prototype.setStyle = fMethods.setStyle;
        Form.prototype.toJSON = fMethods.toJSON;
        Form.prototype.validate = fMethods.validate;

        // form namespace
        Form.prototype.textarea = Textarea;
        Form.prototype.password = Password;
        Form.prototype.wrapper = Wrapper;
        Form.prototype.textfield = Textfield;
        Form.prototype.label = Label;
        Form.prototype.submit = Submit;


        //Label method
        Label.prototype.setText = fMethods.setText;
        Label.prototype.valArg = fMethods.valArg;
        Label.prototype.setAttr = fMethods.setAttr;
        Label.prototype.parent = fMethods.parent;
        Label.prototype.defaultAttr = fMethods.defaultAttr;
        Label.prototype.getClasses = fMethods.getClasses;
        Label.prototype.defaultClasses = fMethods.defaultClasses;
        Label.prototype.hasClass = fMethods.hasClass;
        Label.prototype.setClass = fMethods.setClass;
        Label.prototype.hasStyle = fMethods.hasStyle;
        Label.prototype.setStyle = fMethods.setStyle;

        //
        formjs.validators = {};
        formjs.validators.alnum = validator.alnum;
        formjs.validators.alpha = validator.alpha;
        formjs.validators.numb = validator.numb;
        formjs.validators.emailAddress = validator.emailAddress;
        formjs.validators.documentFilenames = validator.documentFilenames;
        formjs.validators.notEmpty = validator.notEmpty;
        formjs.validators.postCode = validator.postCode;
        formjs.validators.greaterThan = validator.greaterThan;

        formjs.cmp = {
            form : Form,
            wrapper : Wrapper
        };

        //static variables and methods
        /**
         *
         * @type {Object}
         * @private
         */
        formjs._cfg = {
            /**
             * @type {String}
             */
            elementsWithName : 'textfield,textarea,password',
            /**
             * @type {Object}
             */
            attributes : {
                /**
                 *
                 */
                form :  {
                    action:'/',
                    method:'POST'
                },
                textfield : {
                    type:'text'
                },
                password : {
                    type:'password'
                },
                submit : {
                    type:'submit'
                },
                wrapper : {

                },
                textarea : {

                }
            },
            classes : {
                input:[
                    'formjs-input'
                ],
                label:[
                    'formjs-label'
                ],
                textarea:[
                    'formjs-textarea'
                ],
                fieldset:[
                    'formjs-fieldset'
                ],
                textfield:[
                    'formjs-textfield'
                ],
                password:[
                    'formjs-password'
                ],
                wrapper:[
                    'formjs-wrapper'
                ],
                submit:[
                    'formjs-submit'
                ]
            }
        }
        formjs._events = {
            submit:{
                click:events.click
            },
            input:{
                click:events.click
            },
            textarea:{
                click:events.click
            },
            form:{
                click:events.click
            },
            wrapper:{
                click:events.click
            },
            password:{
                click:events.click
            },
            label:{
                click:events.click
            },
            textfield:{
                click:events.click,
                change:events.change,
                keyup:events.keyup
            }
        };
        /**
         * Get dom element by id
         * @param id
         * @return {*}
         */
        formjs.getHtmlById = function (id) {
            return elIdArr[id];
        };

        /**
         * Get element object by id
         * @param id
         * @return {*}
         */
        formjs.getObjById = function (id) {
            return objRef[id];
        };

        /**
         * Create instance of form by object
         * @param clsName Class name of root elements
         * @param opts
         */
        formjs.create = function (clsName, opts) {
            return formjs._methods.create(clsName, opts);


        }

        /**
         * Private methods for formjs
         * @type {Object}
         * @private
         */
        formjs._methods = {
            create : function (clsName, opts, parent) {
                /**
                 * Validate arguments
                 * ------------------
                 * Class name exist?
                 */
                if(
                    (!(typeof clsName == 'string') && !clsName.length) &&
                        (opts && opts.type)
                    )
                    throw 'Element name is empty';
                /**
                 * Config object exist?
                 */
                if(arguments.length < 2 && typeof clsName == 'string')
                    throw 'Object with configuration is needed';
                /**
                 * If is only one argument reasign it to correct variables
                 */
                if(typeof clsName == 'object'){
                    opts = clsName;
                    clsName = opts.type
                }
                var create = formjs._methods.create,
                    childs = opts.children,
                    i = childs ? childs.length : 0,
                    el,
                    key,
                    method;
                if(arguments.length == 3 && clsName != 'form'){
                    el = new parent[clsName](opts.id, parent);
                    for(key in opts){
                        method = 'set'+key.charAt(0).toUpperCase()+key.slice(1);
                        if(el[method])
                            el[method](opts[key]);
                    }
                }
                else
                    el = new formjs.cmp[clsName](opts.id);
                while(i--){
                    el.setEl(create(childs[i], undefined, el));
                }
                return el;
            }
        }



    });
}).call(this, this, typeof define === 'function' && define.amd ? define : function (id, factory) {

    if (typeof exports !== 'undefined') {
        // CommonJS has require and exports, use them and execute
        // the factory function immediately. Provide a wrapper
        // for require to deal with jQuery.
        factory(function(id) {
            // jQuery most likely cannot be loaded
            // in a CommonJS environment, unless the developer
            // also uses a browser shim like jsdom. Allow
            // for that possibility, but do not blow
            // up if it does not work. Use of a
            // try/catch has precedent in Node modules
            // for this kind of situation.
            try {
                return require(id);
            } catch (e) {
                // Do not bother returning a value, just absorb
                // the error, the caller will receive undefined
                // for the value.
            }
        }, exports);
    } else {
        // Plain browser. Grab the global.
        var root = this;

        // Create an object to hold the exported properties for Backbone.
        // Do not use "exports" for the variable name, since var hoisting
        // means it will shadow CommonJS exports in that environmetn.
        var exportValue = {};

        // Create a global for Backbone.
        // Call the factory function to attach the Backbone
        // properties to the exports value.
        factory(function(id) {
            if (id === 'jquery') {
                // Support libraries that support the portions of
                // the jQuery API used by Backbone.
                return root.jQuery || root.Zepto || root.ender;
            } else {
                // Only other dependency is underscore.
                return root._;
            }
        }, exportValue);

        // Create the global only after running the factory,
        // so that the previousBackbone for noConflict is found correctly.
        root.formjs = exportValue;
    }
});