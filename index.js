
function Paul(walkFn) {
	if(!(this instanceof Paul)) {
		return new Paul(walkFn);
	}
	var walker = this.walker = Paul.walker(walkFn);
	var depthIter = this.depthIterator = Paul.depthIterator(walker);
	var breadthIter = this.breadthIterator = Paul.breadthIterator(walker);

	this.map = Paul.map(walker);
	this.filter = Paul.filter(walker);
	this.where = Paul.where(walker);

	var methods = ['forEach', 'find', 'findWhere', 'reduce'];
	for(var i = 0; i < methods.length; i++) {
		var method = methods[i];
		var Method = cap(method);

		this['depth'+Method] = Paul[method](depthIter);
		this['breadth'+Method] = Paul[method](breadthIter);
	}
}

Paul.walker = function walker(walkFn) {
	var walker = Array.isArray(walkFn) 
		? function(node, walk) {
			for(var i = 0; i < walkFn.length; i++) {
				var key = walkFn[i];
				if(deepHas(node, key)) walk(key);
			}
		}
		: walkFn;

	return function(tree) {
		var steps = []; // [[String key, Node node]]
		walker(tree, function(prop, node) {
			if(node === void 0) {
				steps.push([prop, deepGet(tree, prop)]);
			} else {
				steps.push([prop, node]);
			}
		});
		return steps;
	}
}

Paul.map = function map(walker) {
	return function _map(node, func) {
		var steps = walker(node);
		var notKeys = [];
		for(var i = 0; i < steps.length; i++) {
			notKeys.push(steps[i][0]);
		}
		var ret = func(deepCopy(node, notKeys));
		for(var i = 0; i < steps.length; i++) {
			var kid;
			var prop = steps[i][0];
			var child = steps[i][1];
			if(Array.isArray(child)) {
				kid = [];
				for(var j = 0; j < child.length; j++) {
					kid.push(this.map(child[j], func));
				}
			} else {
				kid = this.map(child, func);
			}
			deepSet(ret, prop, kid);
		}
		return ret;
	}
}

Paul.filter = function filter(walker) {
	return function _filter(node, func) {
		if(!func(node)) return undefined;
		var steps = walker(node);
		var notKeys = [];
		for(var i = 0; i < steps.length; i++) {
			notKeys.push(steps[i][0]);
		}
		var ret = deepCopy(node, notKeys);
		for(var i = 0; i < steps.length; i++) {
			var kid = null;
			var prop = steps[i][0];
			var child = steps[i][1];
			if(Array.isArray(child)) {
				kid = [];
				for(var j = 0; j < child.length; j++) {
					var son = child[j];
					if(_filter(son, func)) kid.push(son);
				}
			} else if(_filter(child, func)) {
				kid = child;
			}
			deepSet(ret, prop, kid);
		}
		return ret;
	}
}

Paul.where = function where(walker) {
	return function _where(node, obj) {
		return Paul.filter(walker)(node, whereFilter(obj));
	}
}

Paul.depthIterator = function depthIterator(walker) {
	return function _depthIterator(tree) {
		var levels = [[tree]];
		var sweeps = [0];

		function last(arr) {
			return arr[arr.length - 1];
		}

		return {
			next: function next() {
				if(!sweeps.length) return {done: true};
				var nodes = last(levels);
				var index = last(sweeps);
				if(index < nodes.length) {
					sweeps[sweeps.length - 1]++;

					var children = [];
					var steps = walker(nodes[index]);
					for(var i = 0; i < steps.length; i++) {
						children = children.concat(steps[i][1]);
					}
					if(children.length) {
						levels.push(children);
						sweeps.push(0);
					}

					return {
						done: false,
						value: nodes[index]
					};
				} else {
					levels.pop();
					sweeps.pop();
					return next();
				}
			}
		}
	}
}

Paul.breadthIterator = function breadthIterator(walker) {
	return function _breadthIterator(tree) {
		var nodes = [tree];
		var index = 0;
		return {
			next: function next() {
				if(index < nodes.length) {
					return {
						done: false, 
						value: nodes[index++]
					};
				} else {
					children = [];
					for(var i = 0; i < nodes.length; i++) {
						var steps = walker(nodes[i]);
						for(var j = 0; j < steps.length; j++) {
							children = children.concat(steps[j][1]);
						}
					}
					if(!children.length) return {done: true};
					nodes = children;
					index = 0;
					return next();
				}
			}
		};
	}
}

Paul.forEach = function forEach(iterator) {
	return function _forEach(tree, func) {
		var iter = iterator(tree);
		var res;
		while(!(res = iter.next()).done) {
			func(res.value);
		}
	}
}

Paul.find = function find(iterator) {
	return function _find(tree, func) {
		var iter = iterator(tree);
		var res;
		while(!(res = iter.next()).done) {
			if(func(res.value)) return res.value;
		}
		return undefined;
	}
}

Paul.findWhere = function findWhere(iterator) {
	return function _findWhere(tree, obj) {
		return Paul.find(iterator)(tree, whereFilter(obj));
	}
}

Paul.reduce = function reduce(iterator) {
	return function _reduce(tree, func, memo) {
		var iter = iterator(tree);
		var res;
		while(!(res = iter.next()).done) {
			if(memo === void 0) {
				memo = res.value;
			} else {
				memo = func(memo, res.value);
			}
		}
		return memo;
	}
}

Paul.walk = function walk(node, func) {
	function walk(node) {
		return func(node, walk);
	}
	if(Array.isArray(node)) {
		var nodes = [];
		for(var i = 0; i < node.length; i++) {
			nodes.push(walk(node));
		}
		return nodes;
	}
	return walk(node);
}

function cap(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function deepCopy(obj, notKeys) {
	var ret = {};
	for(var key in obj) {
		if(obj.hasOwnProperty(key) && !~notKeys.indexOf(key)) {
			var val = obj[key];
			if(typeof val === 'object') {
				var head = key + '.';
				ret[key] = deepCopy(val, notKeys.reduce(function(s,c) {
					if(!c.indexOf(head)) {
						s.push(c.slice(head.length));
					}
					return s;
				}, []));
			} else {
				ret[key] = val;
			}
		}
	}
	return ret;
}

function deepHas(obj, prop) {
	var levels = prop.split('.');
	for(var i = 0; i < levels.length; i++) {
		obj = obj[levels[i]];
		if(!obj) return false;
	}
	return true;
}

function deepGet(obj, prop) {
	var levels = prop.split('.');
	for(var i = 0; i < levels.length; i++) {
		obj = obj[levels[i]];
	}
	return obj;
}

function deepSet(obj, prop, value) {
	var levels = prop.split('.');
	var end = levels.length - 1;
	for(var i = 0; i < end; i++) {
		obj = obj[levels[i]];
	}
	obj[levels[end]] = value;
}

function whereFilter(obj) {
	return function(node) {
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				if(obj[key] !== node[key]) return false;
			}
		}
		return true;
	}
}

module.exports = Paul;
