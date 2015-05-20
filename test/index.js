
var Paul = require('..');
var assert = require('assert');

describe('Paul', function() {
	describe('constructor(walkFn) Paul', function() {
		it('should not need `new` invokation', function() {
			var nonNew = Paul(['children', 'child']);
			assert.ok(nonNew.map);
			assert.ok(nonNew.filter);
			assert.ok(nonNew.where);
			assert.ok(nonNew.depthForEach);
			assert.ok(nonNew.breadthForEach);
			// ...
		});
	});

	describe('walker(walkFn) func', function() {
		it('should accept a walking function', function() {
			function walkFn(node, walk) {
				if(node.children) walk('children');
				if(node.child) walk('child', node.child);
			}
			var walker = Paul.walker(walkFn);

			var tree1 = {
				id: 1,
				children: [{id: 2}, {id: 3}],
				child: {id: 4},
				value: "*test passes*"
			};

			assert.deepEqual([
				['children', [{id: 2}, {id: 3}]],
				['child', {id: 4}]
			], walker(tree1));

			var tree2 = {
				id: 1,
				child: [{id: 5}]
			};

			assert.deepEqual([
				['child', [{id: 5}]]
			], walker(tree2));
		});

		it('should accept an array', function() {
			var subnodes = ['children', 'child'];
			var walker = Paul.walker(subnodes);

			var tree1 = {
				id: 1,
				children: [{id: 2}, {id: 3}],
				child: {id: 4},
				value: "*test passes*"
			};

			assert.deepEqual([
				['children', [{id: 2}, {id: 3}]],
				['child', {id: 4}]
			], walker(tree1));

			var tree2 = {
				id: 1,
				child: [{id: 5}]
			};

			assert.deepEqual([
				['child', [{id: 5}]]
			], walker(tree2));
		});

		it('should do nested walking properly', function() {
			var walkFn = function(node, walk) {
				if(node.attrs.left.right) walk('attrs.left.right');
			}
			var walker = Paul.walker(walkFn);
			var tree = {
				attrs: {left: {right: {node: true}}}
			};
			assert.deepEqual(walker(tree), [
				['attrs.left.right', {node: true}]]);
		});
	});

	describe('walk(tree, walkFn)', function() {
		it('should walk the tree as described by the walkFn', function() {
			var tree = {
				op: '+',
				left: {value: 8},
				right: {
					op: '/',
					left: {value: 20},
					right: {value: 4}
				}
			};

			var math = Paul.walk(tree, function(node, walk) {
				if(node.op) {
					return '(' + walk(node.left) + node.op + walk(node.right) + ')';
				}
				return node.value;
			});

			assert.equal(math, '(8+(20/4))');
		});
	});

	describe('prototype', function() {
		var treeA = {
			id: 'A',
			children: [{
				id: 'B',
				children: [{id: 'D'}, {id: 'E'}]	
			}, {
				id: 'C', 
				children: [{id: 'F'}, {id: 'G'}]
			}]
		};
		var treeASize = 7;
		var treeAIds = "ABCDEFG".split('');
		var walkerA = new Paul(['children']);

		describe('map(tree, transform) tree', function() {
			it('should return a new tree of results of func', function() {
				var treeB = walkerA.map(treeA, function(node) {
					node.id += node.id;
					return node;
				});

				var treeC = {
					id: 'AA',
					children: [{
						id: 'BB',
						children: [{id: 'DD'}, {id: 'EE'}]	
					}, {
						id: 'CC', 
						children: [{id: 'FF'}, {id: 'GG'}]
					}]
				};

				assert.deepEqual(treeB, treeC);
			});
		});

		describe('filter(tree, predicate) tree', function() {
			it('should return a new tree without failing nodes', function() {
				var treeB = walkerA.filter(treeA, function(node) {
					return node.id !== 'C';
				});

				var treeC = {
					id: 'A',
					children: [{
						id: 'B',
						children: [{id: 'D'}, {id: 'E'}]	
					}]
				};

				assert.deepEqual(treeB, treeC);
			});

			it('should return undefined if the root node fails', function() {
				var treeB = walkerA.filter(treeA.children[1], function(node) {
					return node.id !== 'C';
				});

				assert.equal(treeB, undefined);
			});
		});

		describe('where(tree, properties) tree', function() {
			it('should return a new tree without failing nodes', function() {
				var treeB = walkerA.where(treeA, {id: 'A'});

				var treeC = {
					id: 'A',
					children: []
				};

				assert.deepEqual(treeB, treeC);
			});

			it('should return undefined if the root node fails', function() {
				var treeB = walkerA.where(treeA, {id: 'H'});
				assert.equal(treeB, undefined);
			});
		});

		describe('depthIterator(tree) Iterator', function() {
			it('should return an Iterator with a next function', function() {
				var iter = walkerA.depthIterator(treeA);
				assert.equal(typeof iter.next, 'function');
			});

			it('should return the nodes in depth-first order', function() {
				var iter = walkerA.depthIterator(treeA);
				var ids = '';
				while(true) {
					var res = iter.next();
					if(res.done) break;
					ids += res.value.id;
				}
				assert.equal(ids, 'ABDECFG');
			});
		});

		describe('breadthIterator(tree) Iterator', function() {
			it('should return an Iterator with a next function', function() {
				var iter = walkerA.breadthIterator(treeA);
				assert.equal(typeof iter.next, 'function');
			});

			it('should return the nodes in breadth-first order', function() {
				var iter = walkerA.breadthIterator(treeA);
				var ids = '';
				while(true) {
					var res = iter.next();
					if(res.done) break;
					ids += res.value.id;
				}
				assert.equal(ids, 'ABCDEFG');
			});
		});

		describe('depthForEach(tree, iteratee)', function() {
			it('should call func on each node in the tree', function() {
				var ids = [];
				walkerA.depthForEach(treeA, function(node) {
					ids.push(node.id);
				});

				assert.equal(treeASize, ids.length);
				for(var i = 0; i < ids.length; i++) {
					assert.ok(~treeAIds.indexOf(ids[i]));
				}
			});
		});

		describe('breadthForEach(tree, iteratee)', function() {
			it('should call func on each node in the tree', function() {
				var ids = [];
				walkerA.breadthForEach(treeA, function(node) {
					ids.push(node.id);
				});

				assert.equal(treeASize, ids.length);
				for(var i = 0; i < ids.length; i++) {
					assert.ok(~treeAIds.indexOf(ids[i]));
				}
			});
		});

		describe('depthFind(tree, predicate) node', function() {
			it('should return the first passing node', function() {
				var node = walkerA.depthFind(treeA, function(node) {
					return node.id === 'C' || node.id === 'E';
				});
				assert.equal(node.id, 'E');
			});

			it('should return undefined if no node passes', function() {
				var node = walkerA.depthFind(treeA, function(node) {
					return node.id === 'H';
				});
				assert.equal(node, undefined);
			});

			it('should perform depth-first search', function() {
				var path = [];
				var node = walkerA.depthFind(treeA, function(node) {
					path.push(node.id);
					return node.id === 'F';
				});

				assert.deepEqual(path, "ABDECF".split(''));
			});
		});

		describe('breadthFind(tree, predicate) node', function() {
			it('should return the first passing node', function() {
				var node = walkerA.breadthFind(treeA, function(node) {
					return node.id === 'C' || node.id === 'E';
				});
				assert.equal(node.id, 'C');
			});

			it('should return undefined if no node passes', function() {
				var node = walkerA.breadthFind(treeA, function(node) {
					return node.id === 'H';
				});
				assert.equal(node, undefined);
			});

			it('should perform breadth-first search', function() {
				var path = [];
				var node = walkerA.breadthFind(treeA, function(node) {
					path.push(node.id);
					return node.id === 'F';
				});

				assert.deepEqual(path, "ABCDEF".split(''));
			});
		});

		describe('depthFindWhere(tree, properties) node', function() {
			it('should return the first passing node', function() {
				var node = walkerA.depthFindWhere(treeA, {id: 'G'});
				assert.equal(node.id, 'G');
			});

			it('should return undefined if no node passes', function() {
				var node = walkerA.depthFindWhere(treeA, {id: 'H'});
				assert.equal(node, undefined);
			});
		});

		describe('breadthFindWhere(tree, properties) node', function() {
			it('should return the first passing node', function() {
				var node = walkerA.breadthFindWhere(treeA, {id: 'G'});
				assert.equal(node.id, 'G');
			});

			it('should return undefined if no node passes', function() {
				var node = walkerA.breadthFindWhere(treeA, {id: 'H'});
				assert.equal(node, undefined);
			});
		});

		describe('depthReduce(tree, iteratee, [memo]) memo', function() {
			it('should return the accumlated result of a tree', function() {
				var count = walkerA.depthReduce(treeA, function(sum, node) {
					return sum + 1;
				}, 0);
				assert.equal(count, treeASize);
			});

			it('should use the root node as the intial value if none is provided', function() {
				var root = walkerA.depthReduce(treeA, function(root) {
					return root;
				});
				assert.equal(root, treeA);
			});

			it('should perform depth-first processing', function() {
				var ids = walkerA.depthReduce(treeA, function(str, node) {
					return str + node.id; 
				}, '');
				assert.equal(ids, "ABDECFG");
			});
		});

		describe('breadthReduce(tree, iteratee, [memo]) memo', function() {
			it('should return the accumlated result of a tree', function() {
				var count = walkerA.breadthReduce(treeA, function(sum, node) {
					return sum + 1;
				}, 0);
				assert.equal(count, treeASize);
			});

			it('should use the root node as the intial value if none is provided', function() {
				var root = walkerA.breadthReduce(treeA, function(root) {
					return root;
				});
				assert.equal(root, treeA);
			});

			it('should perform breadth-first processing', function() {
				var ids = walkerA.breadthReduce(treeA, function(str, node) {
					return str + node.id; 
				}, '');
				assert.equal(ids, "ABCDEFG");
			});
		});
	});

});
