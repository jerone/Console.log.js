/*
Console.log.js - Cross-Browser solution for console logging in JavaScript (codenamed console.log.js)

@author Jeroen van Warmerdam (aka jerone or jeronevw) (http://www.jeroenvanwarmerdam.nl)
@date 14-02-2010 16:30
@version 0.1 RC1

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
|							multiple arguments are combined together with a space (space-delimited);
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are printed as "undefined";
|							Object arguments show 1 value, rest is shown by clicking on it;
|							Object's uses "=" for value's;
|							substitution patterns %d, %i and %f are not converted to their datatypes;
|							capital substitution patterns uses the original arguments, without converting it to an inline String;
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
|							multiple arguments are combined together with a space (space-delimited);
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are NOT printed;
|							Object arguments show no value, only shown by clicking on it;
|							Object's uses ": " for value's;
|							lowercase substitution patterns %d, %i and %f are only printed when they match their strict datatype, otherwise 0;
|							capital substitution patterns prints "[object Object]", except for Object's which prints the arguments;
|							console.clear() doesn't exist and has problems with console.log.call();
|							console.info() hasn't an icon;
|	Safari 
|		4+
|			console --> intern (http://webkit.org/blog/197/web-inspector-redesign/);
|							Object and Element are linkable for more information;
|							commands with no arguments are not executed;
|							multiple arguments are combined together with a space (space-delimited);
|							multilines possible;
|							logging functions return "undefined";
|							empty Array value's are NOT printed;
|							Object arguments show no value, only shown by clicking on it;
|							Object's uses ": " for value's;
|							lowercase substitution patterns %d, %i and %f are converted to their correct datatype, otherwise 0;
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
|							lowercase substitution patterns %d, %i and %f are only printed when they match their strict datatype, otherwise 0 and with float NaN;
|							capital substitution patterns are not supported;
|							RegExp flags are in "igm" order, instead of "gim";
|							empty RegExp returns "//" instead of "/(?:)/";

TODO:
* FIX: multiple lines alignement;
* ADD: anti alert flood;
* ADD: add latest console.profile() and console.profileEnd();
* ADD: line numbers;

*/

(function(_w, undefined) {

	var _w_c = _w.console || {},
		_w_c_s = _w_c.settings || {},
		_uA = navigator.userAgent,
		_obj = Object.prototype.toString,
		_loggingFn = ["log", "debug", "info", "warn", "error"],
		_specialFn = ["assert", "clear", "count", "dir", "dirxml", "group", "groupCollapsed", "groupEnd", "profile", "profileEnd", "time", "timeEnd", "trace"];

	_w_c.ConsoleLogJS = "0.1rc1";  // version number;

	_w_c_s = _w_c.settings = {
		override: _w_c_s.override !== undefined ? _w_c_s.override : true, 		// override the console function;
		ie_dt: _w_c_s.ie_dt !== undefined ? _w_c_s.ie_dt : true, 				// use IE Developer Toolbar functions;
		opera: _w_c_s.opera !== undefined ? _w_c_s.opera : true, 				// use Opera postError function;
		alert: _w_c_s.alert !== undefined ? _w_c_s.alert : true, 				// use plain old alert function;
		limit: _w_c_s.limit !== undefined ? _w_c_s.limit : 3					// limit how deed to give source;
	};

	if(!!_w_c_s.override && (!_w_c.firebug || _obj.call(_w_c_s.override) === "[object Function]" || _obj.call(_w_c_s.override) === "[object Object]")) {  // we know Firebug has these functions;

		var IE = (/msie/i.test(_uA) && !/opera/i.test(_uA)),
			WebKit = / AppleWebKit\//.test(_uA),
			Pattern = /%([sdifo])/gi,  // substitution patterns;
			Override = function(type) {
				return (!!_w_c_s.override && (
							(_obj.call(_w_c_s.override) === "[object Function]" && _w_c_s.override) ||
							(_obj.call(_w_c_s.override) === "[object Object]" && (type && _w_c_s.override[type] || _w_c_s.override["log"]))
						) || false);
			},
			Console = function(type) {
				return (Override(type))
					|| (_w_c_s.ie_dt && IE && (type && _w_c[type] || _w_c["log"]))
					|| (_w_c_s.opera && _w.opera && opera.postError)
					|| (_w_c_s.alert && alert)
					|| function() { return undefined; };
			},
			Source = function(arg, limit) {
				var result = "";
				if(arg === null) {  // null;
					result = "null";
				} else if(typeof arg === "undefined" || typeof arg === undefined) {  // undefined;
					result = "undefined";
				} else if(arg === true || arg === false) {  // Boolean;
					result = !!arg ? "true" : "false";
				} else if(arg === "") {  // empty String (before normal String);
					result = "";
				} else if(_obj.call(arg) === "[object String]") {  // String;
					result = '"' + arg + '"';
				} else if(_obj.call(arg) === "[object Date]") {  // Date;
					result = arg.toString();
				} else if(_obj.call(arg) === "[object Number]") {  // Number;
					result = arg.toString();
				} else if(_obj.call(arg) === "[object Navigator]" || (arg.constructor && arg.constructor.toString() === "[object Navigator]")) {  // Navigator Element (before Element, Array & Object);
					result = "Navigator";
				} else if(_obj.call(arg) === "[object Window]" || (arg.constructor && arg.constructor.toString() === "[object Window]")) {  // Window Element (before Element, Array & Object);
					result = "Window";
				} else if(arg.nodeType) {  // Element (before Array & Object);
					if(arg.nodeType === 3 || arg.nodeName === "#text") {  // text node;
						result = arg.textContent || arg.nodeValue;
					} else if(arg.nodeType === 8 || arg.nodeName === "#comment") {  // comment node;
						result = arg.text;
					} else if(arg.nodeType === 9 || arg.nodeName === "#document") {  // document node;
						result = "Document";
					} else if(arg.tagName && arg.attributes) {
						result = "<" + arg.tagName.toLowerCase();
						var i = 0, l = arg.attributes.length;
						for(; i < l; i++) {
							result += "\t" + arg.attributes[i].name + "='" + arg.attributes[i].value + "'";
						}
						if(arg.childNodes.length === 0) {
							result += "/";
						}
						result += ">";
					} else {
						result = arg.toString();
					}
				} else if(_obj.call(arg) === "[object Array]") {  // Array;
					result = "[";
					var arr_list = [], i = 0, l = arg.length;
					for(; i < l; i++) {
						arr_list[i] = Source(arg[i], limit);
					}
					result += arr_list.join(", ") + "]";
				} else if(_obj.call(arg) === "[object RegExp]" || arg instanceof RegExp) {  // RegExp (before Function);
					result = (arg.valueOf() ||
							  arg.toString() ||
							  "/" + arg.source + "/" + (arg.global ? "g" : "") + (arg.ignoreCase ? "i" : "") + (arg.multiline ? "m" : "") + (arg.sticky ? "y" : "")
							 ).toString().replace(/^\/\/$/, "\/\(?:)\/").replace(/^(\/.*\/)(ig)(m?)$/g, "$1gi$3");
				} else if(_obj.call(arg) === "[object Function]") {  // Function;
					result = arg.toString();
				} else if(typeof arg === "object") {  // Object (last);
					if(!limit) { return "{ more... }"; }
					result = "{ ";
					var arr_obj = [];
					for(var key in arg) {
						arr_obj.push("'" + key + "': " + Source(arg[key], limit - 1));
					}
					result += arr_obj.join(", ") + " }";
				} else {  // ...
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
					case "clear":
						return function() {
							var ln = "\n \n";
							if(!WebKit) {
								_w_c.log.call({ internal: ln }, "");
								_w_c.log.call({ internal: ln }, "");
								_w_c.log.call({ internal: ln }, "");
							} else {
								_w_c.log(ln);
								_w_c.log(ln);
								_w_c.log(ln);
							}
							ln = null;
						};
					case "count":
						return function(title) {
							title = title || "";
							var acc = arguments.callee._counters = arguments.callee._counters || {};
							_w_c.log.call({ internal: (title !== "" ? title + " " : "") + (acc[title] = ++acc[title] || 1) }, "");
							title = acc = null;
						};
					case "dir":
						return function(arg) {
							var result = "";
							if(_obj.call(arg) === "[object String]") {  // String;
								arg = arg.split("");
							}
							try {
								for(var item in arg) {
									result += item.toString() + "\t\t";
									try {
										result += Source(arg[item], _w_c_s.limit) + "\n";
									} catch(e) {  // probably Packages, sun, java, netscape or external;
										result += item.toString() + "\n";
									}
								}
							} catch(e) {  // probably Packages, sun, java, netscape or external;
								result += arg.toString() + "\n";
							}
							_w_c.log.call({ internal: result }, "");
							arg = result = null;
						};
					case "dirxml":
						return function(node) {
							if(node && node.nodeType) {  // Element;
								var SourceXML = function(node, limit) {
									var result,
										begin = result = Source(node, _w_c_s.limit),
										i = 0, l = node.childNodes.length,
										closingTag = /\<([a-z]*)\b/i,
										noTextNode = false;
									if(l > 0) {
										for(; i < l; i++) {
											var newNode = node.childNodes[i];
											if((noTextNode = newNode.nodeType !== 3 && newNode.nodeName !== "#text")) {
												result += "\n\t";
											}
											if(limit > 0 && newNode.childNodes.length > 0) {
												result += SourceXML(newNode, limit - 1);
											} else {
												result += Source(newNode, _w_c_s.limit);
											}
										}
										if(noTextNode) {
											result += "\n\t";
										}
										result += "</" + begin.match(closingTag)[1] + ">";  // closing tag;
									}
									node = limit = begin = i = l = closingTag = noTextNode = null;
									return result;
								}
								_w_c.log.call({ internal: SourceXML(node, _w_c_s.limit) }, "");
							}
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
							name = timer = null;
						};
					case "trace":
						return function() {
							try {
								i.dont.exist++;
							} catch(e) {
								_w_c.log((e.stack || e.stacktrace).split("\n").slice(2).join("\n"));
							}
						};
					case "profile":
					case "profileEnd":
					default:
						return function() { };
				}
			};

		for(var i in _loggingFn) {
			var _type = _loggingFn[i];
			if(!_w_c[_type] || (IE && _w.console) || !!Override(_type)) {  // console[_loggingFn] doesn't exist and we override IE Developer Toolbar console to gain more arguments information;
				_w_c[_type] = (function(type) {
					return function() {
						var prefix = IE ? "" : (function() {
								switch(type) {
									case "info": return "(i): ";
									case "warn": return "/!\\: ";
									case "error": return "(X): ";
									default: return "";
								}
							})(),
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
							if(_Source.match(Pattern)) {  // substitution patterns;
								var match, count = 0;
								while((match = _Source.match(Pattern))) {
									_Source = _Source.replace(match[0], Source(arguments[++count], limit));
								}
								while(++count < l) {
									_Source += " " + Source(arguments[count], limit);
								}
							} else {
								for(; i < l; i++) {  // just multiple arguments;
									_Source += Source(arguments[i], limit) + " ";
								}
							}
						}
						(Console(type))(align + prefix + (this.internal || "") + _Source);
						prefix = _Source = i = l = limit = null;
						return arguments;
					};
				})(_type);
			}
		}
		for(var i in _specialFn) {
			var _type = _specialFn[i];
			if(!_w_c[_type]) {  // no console[_specialFn];
				_w_c[_type] = Special(_type);
			}
		}

	}  // end if override && firebug;

	if(!_w.console) {  // if console doesn't exist, create it (e.g. Opera);
		_w.console = _w_c;
	}

	_loggingFn = _specialFn = null;

})(window);