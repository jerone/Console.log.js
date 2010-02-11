/*
Console.log.js - XB solution for logging in JavaScript (codenamed console.log.js)

@author Jeroen van Warmerdam (aka jerone or jeronevw) (http://www.jeroenvanwarmerdam.nl)
@date 06-02-2010 14:00:00
@version 0.1 Alpha

Copyright 2010, Jeroen van Warmerdam

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

XB (CrossBrowser):
|	Firefox
|		3-
|			console --> intern;
|		3+ 
|			console --> Firebug (http://getfirebug.com/wiki/index.php/Console_API);
|							Object, Element, Array and Date are linkable for more information;
|							commands with no arguments show a very small logline without information;
|							multiple arguments are combined together with a space;
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are printed as "undefined";
|							Object arguments show 1 value, rest is shown by clicking on it;
|							Object's uses "=" for value's;
|							capital substitution patterns uses the original arguments, without converting it to a String;
|							console.timer() uses console.info();
|	Opera
|		9-
|			opera.postError --> intern;
|		9+
|			opera.postError --> Dragonfly 0.7
|							no console supported;
|							multiple arguments are printed for each argument seperate;
|							multilines only possible after clicking, before just only the first line;
|							multiple spaces are being truncated to 1 space;
|							Object's are printed as "[object Object]";
|							Array's are printed with only the values, seperated by ",". Also Array's in Array's;
|							empty RegExp returns "//" instead of "/(?:)/";
|	Chrome 
|		3+
|			console --> intern (http://webkit.org/blog/197/web-inspector-redesign/);
|							Object and Element are linkable for more information;
|							commands with no arguments are not executed;
|							multiple arguments are combined together with a space;
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are NOT printed;
|							Object arguments show no value, only shown by clicking on it;
|							Object's uses ": " for value's;
|							capital substitution patterns prints "[object Object]", except for Object's which prints the arguments;
|							console.clear() doesn't exist and has problems with console.log.call();
|							console.info() hasn't an icon;
|	Safari 
|		4+
|			console --> intern (http://webkit.org/blog/197/web-inspector-redesign/);
|							Object and Element are linkable for more information;
|							commands with no arguments are not executed;
|							multiple arguments are combined together with a space;
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are NOT printed;
|							Object arguments show no value, only shown by clicking on it;
|							Object's uses ": " for value's;
|							capital substitution patterns prints "[object Object]", except for Object's which prints the arguments;
|							console.clear() doesn't exist and has problems with console.log.call();
|							console.info() hasn't an icon;
|	IE
|		6
|			alert;
|		7 & 8
|			console --> IE Developer Toolbar (http://msdn.microsoft.com/en-us/library/dd565625%28VS.85%29.aspx);
|							multiple arguments are combined together without a seperator;
|							empty Array value's are NOT printed;
|							Object's are printed as "[object Object]";
|							Array's are printed with only the values, seperated by ",". Also Array's in Array's;
|							console.debug(), console.group(), console.groupEnd(), console.count(), console.time() and console.timeEnd() don't exist;
|							console.log() adds "LOG: " before every message;
|							RegExp flags are in "igm" order, instead of "gim";
|							empty RegExp returns "//" instead of "/(?:)/";

TODO:
* MOD: implement capital substitution patterns too; 
* ADD: anti alert flood;
* FIX: multiple lines alignement;

*/

(function(_w, undefined) {

	var _w_c = _w.console || {},
		_w_c_s = _w_c.settings || {},
		_uA = navigator.userAgent,
		_obj = Object.prototype.toString,
		_loggingFn = ["log", "debug", "info", "warn", "error"],
		_specialFn = ["assert", "clear", "count", "dir", "dirxml", "group", "groupCollapsed", "groupEnd", "profile", "profileEnd", "time", "timeEnd", "trace"];

	_w_c.ConsoleLogJS = "0.1a";  // version number;

	_w_c_s = _w_c.settings = {
		override: _w_c_s.override !== undefined ? _w_c_s.override : true, 		// override the console function;
		ie_dt: _w_c_s.ie_dt !== undefined ? _w_c_s.ie_dt : true, 				// use IE Developer Toolbar functions;
		opera: _w_c_s.opera !== undefined ? _w_c_s.opera : true, 				// use Opera postError function;
		alert: _w_c_s.alert !== undefined ? _w_c_s.alert : true, 				// use plain old alert function;
		limit: _w_c_s.limit !== undefined ? _w_c_s.limit : 3					// limit how deed to give source;
	};

	if(_w_c_s.override !== false && !_w_c.firebug) {  // we know Firebug has these functions;

		var IE = (/msie/i.test(_uA) && !/opera/i.test(_uA)),
			WebKit = / AppleWebKit\//.test(_uA),
			Pattern = /%([sdifo])/g,  // substitution patterns;
			Console = function(type) {
				return (_w_c_s.ie_dt && IE && (type && _w_c[type] || _w_c["log"]))
					|| (_w_c_s.opera && _w.opera && opera.postError)
					|| (_w_c_s.alert && alert)
					|| function() { return undefined; };
			},
			Source = function(arg, limit) {
				var result = "";

				if(arg === null) {  // null;
					result = "null";
				}
				else if(typeof arg === "undefined") {  // undefined;
					result = "undefined";
				}
				else if(arg === true || arg === false) {  // Boolean;
					result = !!arg ? "true" : "false";
				}
				else if(arg === "") {  // empty String (before normal String);
					result = "";
				}
				else if(_obj.call(arg) === "[object String]") {  // String;
					result = '"' + arg + '"';
				}
				else if(_obj.call(arg) === "[object Date]") {  // Date;
					result = arg.toString();
				}
				else if(_obj.call(arg) === "[object Number]") {  // Number;
					result = arg.toString();
				}
				else if(arg.nodeType) {  // Element (before Array & Object);
					result = "<" + arg.tagName.toLowerCase();
					var i = 0, l = arg.attributes.length;
					for(; i < l; i++) {
						result += " " + arg.attributes[i].name + "='" + arg.attributes[i].value + "'";
					}
					if(arg.childElementCount === 0) {
						result += "/";
					}
					result += ">";
				}
				else if(_obj.call(arg) === "[object Array]") {  // Array;
					result = "[";
					var arr_list = [], i = 0, l = arg.length;
					for(; i < l; i++) {
						arr_list[i] = Source(arg[i], limit);
					}
					result += arr_list.join(", ") + "]";
				}
				else if(_obj.call(arg) === "[object RegExp]" || arg instanceof RegExp) {  // RegExp (before Function);
					result = (arg.valueOf() ||
							  arg.toString() ||
							  "/" + arg.source + "/" + (arg.global ? "g" : "") + (arg.ignoreCase ? "i" : "") + (arg.multiline ? "m" : "") + (arg.sticky ? "y" : "")
							 ).toString().replace(/^\/\/$/, "\/\(?:)\/").replace(/^(\/.*\/)(ig)(m?)$/g, "$1gi$3");
				}
				else if(_obj.call(arg) === "[object Function]") {  // Function;
					result = arg.toString();
				}
				else if(typeof arg === "object") {  // Object (last);
					if(!limit) { return "{ more... }"; }
					result = "{ ";
					var arr_obj = [];
					for(var key in arg) {
						arr_obj.push("'" + key + "': " + Source(arg[key], limit - 1));
					}
					result += arr_obj.join(", ") + " }";
				}
				else {  // ...
					result = arg.toString();
				}

				return result;
			},
			Special = function(fx) {
				switch(fx) {
					case "assert":
						return function(is_ok, message) {
							if(!is_ok) {
								_w_c.error.call({ internal: "ASSERT FAIL: " }, message);
							}
						};
					case "count":
						return function(title) {
							title = title || "";
							var acc = arguments.callee._counters = arguments.callee._counters || {};
							_w_c.log.call({ internal: (title !== "" ? title + " " : "") + (acc[title] = ++acc[title] || 1) }, "");
							acc = title = null;  // clean up;
						};
					case "group":
					case "groupCollapsed":
						return function() {
							_w_c.log.call({
								internal: ("+-------------------" +
										  (arguments.length && arguments[0] !== "" ? " " + (Array.prototype.slice.call(arguments)).join(" ") + " " : "") +  // IE only accepts Array.prototype.slice.call for cloning;
										  ("--------------------"))
							}, "");
							_w_c._groups = (_w_c._groups && _w_c._groups > 0 ? _w_c._groups : 0) + 1;
						};
					case "groupEnd":
						return function() {
							_w_c._groups = (_w_c._groups && _w_c._groups > 0 ? _w_c._groups : 1) - 1;
							_w_c.log.call({ internal: ("+---------------------------------------") }, "");
						};
					case "time":
						return function(name) {
							if(name) {
								(_w_c._timers = _w_c._timers || {})[name] = (new Date).getTime();
							}
						};
					case "timeEnd":
						return function(name) {
							var timer = (_w_c._timers = _w_c._timers || {})[name];
							if(name && timer) {
								_w_c.info.call({ internal: name + ": " + ((new Date).getTime() - timer) + "ms" }, "");
							}
							timer = name = null;  // clean up;
						};
					case "trace":
						return function() {
							try {
								i.dont.exist++;
							} catch(e) {
								_w_c.log((e.stack || e.stacktrace).split("\n").slice(2).join("\n"));
							}
						};
					case "clear":
						return function() {
							if(!WebKit) {
								_w_c.log.call({ internal: "\n \n" }, "");
								_w_c.log.call({ internal: "\n \n" }, "");
								_w_c.log.call({ internal: "\n \n" }, "");
							} else {
								_w_c.log("\n \n");
								_w_c.log("\n \n");
								_w_c.log("\n \n");
							}
						};
					case "dir":
						return function(obj) {
							var result = "";
							for(var i in obj) {
								result += i.toString() + "		" + Source(obj[i], _w_c_s.limit) + "\n";
							}
							_w_c.log.call({ internal: result }, "");
						};
					case "dirxml":
					case "profile":
					case "profileEnd":
					default:
						return function() { };
				}
			};

		for(var i in _loggingFn) {
			var _fn = _loggingFn[i];
			if(!_w_c[_fn] || (IE && _w.console)) {  // console[_loggingFn] doesn't exist and we override IE Developer Toolbar console to gain more arguments information;
				_w_c[_fn] = (function(type) {
					var _Console = Console(type);
					return function() {
						var prefix = IE ? "" :
										type == "info" ? "(i): " :
											type == "warn" ? "/!\\: " :
												type == "error" ? "(X): " :
													"",
							_Source = arguments[0],
							i = 0, l = arguments.length,
							limit = _w_c_s.limit,
							align = (function() {
								var groups = (_w_c._groups || 0), align = "";
								while(groups-- > 0) {
									align += "|  ";
								}
								return align;
							})();
						if(l == 1) {  // single argument;
							_Source = Source(_Source, limit);
						} else if(l > 1) {  // multiple arguments;
							if(Pattern.test(_Source)) {  // substitution patterns;
								var match, count = 0;
								while((match = Pattern.exec(_Source))) {
									_Source = _Source.replace(match[0], Source(arguments[++count], limit));
								}
								while(l > count++) {
									_Source += " " + Source(arguments[count], limit);
								}
							} else {
								for(; i < l; i++) {  // just multiple arguments;
									_Source += Source(arguments[i], limit) + " ";
								}
							}
						}
						_Console(align + prefix + (this.internal || "") + _Source);
						prefix = _Source = i = l = limit = null;  // clean up;
						return arguments;
					};
				})(_fn);
			}
		}
		for(var i in _specialFn) {
			var _fn = _specialFn[i];
			if(!_w_c[_fn]) {  // no console[_specialFn];
				_w_c[_fn] = Special(_fn);
			}
		}

	}  // end if override && firebug;

	if(!_w.console) {  // if console doesn't exist, create it (e.g. Opera);
		_w.console = _w_c;
	}

	_loggingFn = _specialFn = null;  // clean up;

})(window);