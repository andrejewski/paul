# Paul

Paul is a library of functions for working with tree data structures such as abstract syntax trees, binary trees, and other nested data structures.

```bash
npm install paul # hey, that rhymes
```

## Usage

```js
var Paul = require('paul');
var Walker = new Paul(['children']);

var tree = {
	value: 10,
	children: [{
		value: 6
	}, {
		value: 4
	}]
};

var sum = Walker.depthReduce(tree, function(num, node) {
	return num + node.value;
}, 0);

require('assert').equal(20, sum);
```

## Documentation

- [`Paul(walkFn)`](https://github.com/andrejewski/paul#paulwalkfn)
	- [`walker(walkFn) func`](https://github.com/andrejewski/paul#walkerwalkfn-func)
	- [`walk(tree, walkFn)`](https://github.com/andrejewski/paul#walktree-walkfn)
	- `prototype`
		- [`map(tree, transform) tree`](https://github.com/andrejewski/paul#maptree-transform-tree)
		- [`filter(tree, predicate) tree`](https://github.com/andrejewski/paul#filtertree-predicate-tree)
		- [`where(tree, properties) tree`](https://github.com/andrejewski/paul#wheretree-properties-tree)
		- [`iterator(tree) Iterator`](https://github.com/andrejewski/paul#iteratortree-iterator)
		- [`forEach(tree, iteratee)`](https://github.com/andrejewski/paul#foreachtree-iteratee)
		- [`find(tree, predicate) node`](https://github.com/andrejewski/paul#findtree-predicate-node)
		- [`findWhere(tree, properties) node`](https://github.com/andrejewski/paul#findwheretree-properties-node)
		- [`reduce(tree, iteratee, [memo]) memo`](https://github.com/andrejewski/paul#reducetree-iteratee-memo-memo)
		- [`parent(tree, node) parentNode`](https://github.com/andrejewski/paul#parenttree-node-parentnode)
		- [`siblings(tree, node) {left, right}`](https://github.com/andrejewski/paul#siblingstree-node-left-right)

**Note:** Methods `iterator()` through `siblings()` are not actual methods and instead there are two methods that differ solely on traversal method. For instance, `find()` must be called as either `depthFind()` or `breadthFind()`. An [explanation](http://stackoverflow.com/a/687752/1444710) of the difference between these traversals may be helpful.

Assume all code examples are preceded by the following:

```js
var Paul = require('paul');
var assert = require('assert');
```

===

### Paul(walkFn)

An instance of Paul will have all of the prototype functions listed above. See `walker(walkFn)` for a description of a valid walking function.

*Note:* the `new` keyword is optional but recommended.

===

### walker(walkFn) func

The function `walker` takes a walking function and returns a function to be used on a node to return its children.

What makes Paul useful is this function. Supply `walker` a walking function with the signature `function(node, walk)`, which decides how a node's children are walked or ignored.

Say you have an AST where you could have one or more child nodes on the properties `left`, `right`, and/or `children` for any given node. The appropriate walk function would be:

```js
function walkFn(node, walk) {
	if(node.left) walk('left');
	if(node.right) walk('right');
	if(node.children) walk('children');
}
var walker1 = Paul.walker(walkFn);
```

Paul walks through the given tree node-by-node with your walk function until no more child nodes are found and the walking ends.

If an AST has a lot of properties that could have child nodes values, `walker` also accepts an array of property keys.

```js
var walker2 = Paul.walker(['left', 'right', 'children']);
// walker 2 does the same as walker 1.
```

===

### walk(tree, walkFn)

Takes a `tree` and a function that accepts a `node` and `walk(node)` callback.

This function is not a method of an instance of Paul for the simple reason that you walk the nodes yourself.

All this function does is pass the given function `walkFn` the `node` to be processed and the function `walk` and return the value computed by the `walkFn`. 

Confused? An example will help us both honestly.

```js
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
```

If only the `walkFn` is provided, the function will return a generic function to call on any `tree`.

===

### map(tree, transform) tree

Produces a new tree of nodes by mapping each node in **tree** through a transformation function **transform**. The function is passed one argument `node`.

```js
var pine = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var palm = paul.map(pine, function(node) {
	node.id += node.id;
	return node;
});

var tree = {id: "AA", kids: [{id: "BB"}, {id: "CC"}]};
assert.deepEqual(palm, tree);
```

===

### filter(tree, predicate) tree

Looks through each node in the **tree**, returning a tree of all the nodes that pass a truth test **predicate**. Any nodes that fail the truth test and their sub-nodes will be removed. Sub-nodes will not be tested if the parent node fails.

```js
var pine = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var palm = paul.filter(pine, function(node) {
	return node.id === "A";
});

var tree = {id: "A", kids: []};
assert.deepEqual(palm, tree);
```

===

### where(tree, properties) tree

Looks through each node in the **tree**, returning a tree of all the nodes that contain all of the key-value pairs listed in **properties**. Any nodes that fail the truth test and their sub-nodes will be removed. Sub-nodes will not be tested if the parent node fails.

```js
var pine = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var palm = paul.where(pine, {id: "A"});

var tree = {id: "A", kids: []};
assert.deepEqual(palm, tree);
```

===

### iterator(tree) Iterator

Returns an iterator that returns each node in the tree in the specified traversal order. 

- `depthIterator(tree) Iterator`: depth-first
- `breadthIterator(tree) Iterator`: breadth-first

An [explanation](http://stackoverflow.com/a/687752/1444710) of the difference between these traversals may be helpful.

Each `next()` call on the returned iterator returns an object containing a boolean `done` which is true when there are no more nodes to iterator over and `value` which is the node. This conforms to the ES6 [Iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols).

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var text = "";
var iter = paul.depthIterator(tree);

while(true) {
	var res = iter.next();
	if(res.done) break;
	text += node.id;
}

assert.equal(text, "ABC");
```

===

### forEach(tree, iteratee)

Iterates over a **tree**, yielding each node in turn to an **iteratee** function. Each invocation of iteratee is called with one argument `node`. Iteration order is decided by which method is used.

- `depthForEach(tree, iteratee)`: depth-first
- `breadthForEach(tree, iteratee)`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var text = "";
paul.depthForEach(tree, function(node) {
	text += node.id;
});

assert.equal(text, "ABC");
```

===

### find(tree, predicate) node

Looks through each node in the **tree**, returning the first one that passes a truth test **predicate**, or `undefined` if no node passes the test. The function returns as soon as it finds an acceptable node, and doesn't traverse the entire tree.

- `depthFind(tree, predicate)`: depth-first
- `breadthFind(tree, predicate)`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var node = paul.depthFind(tree, function(node) {
	return node.id === "B";
});

assert.deepEqual(node, {id: "B"});
```

===

### findWhere(tree, properties) node

Looks through each node in the **tree**, returning the first node that contains all of the key-value pairs listed in **properties**, or `undefined` if no node passes the test. The function returns as soon as it finds an acceptable node, and doesn't traverse the entire tree.

- `depthFindWhere(tree, properties)`: depth-first
- `breadthFindWhere(tree, properties)`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var node = paul.depthFindWhere(tree, {id: "B"}});

assert.deepEqual(node, {id: "B"});
```

===

### reduce(tree, iteratee, [memo]) memo

Also known as inject and foldl, reduce boils down a **tree** of nodes into a single value. **Memo** is the initial state of the reduction, and each successive step of it should be returned by **iteratee**. The iteratee is passed two arguments: the memo, then the node.

If no memo is passed to the initial invocation of reduce, the iteratee is not invoked on the root node of the tree. The root node is instead passed as the memo in the invocation of the iteratee on the next node in the tree.

- `depthReduce(tree, iteratee, [memo])`: depth-first
- `breadthReduce(tree, iteratee, [memo])`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var text = paul.depthReduce(tree, function(str, node) {
	return str + node.id;
}, "");

assert.equal(text, "ABC");
```

===

### parent(tree, node) parentNode

Returns the parent node of the given **node**. If the node is not found in the **tree** or the node has no parent (meaning the node is the tree), `undefined` is returned. 

- `depthParent(tree, node) parentNode`: depth-first
- `breadthParent(tree, node) parentNode`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}]};
var paul = new Paul(['kids']);

var nodeB = tree.kids[0];
var parentOfB = paul.depthParent(tree, nodeB);

assert.equal(tree, parentOfB);
```

===

### siblings(tree, node) {left, right}

Returns the sibling nodes of the given **node**. If the node is not found in the **tree** or the node has no parent (meaning the node is the tree), `undefined` is returned. Also if the node is not in an Array member (i.e `{child: node}`), the node cannot have any siblings and thus `undefined` is returned.

Siblings of a node are returned in an object containing two properties `left` and `right`. Siblings that come before the given node are placed in the `left` property. Siblings that come after the given node are placed in the `right` property.

- `depthSiblings(tree, node) {left, right}`: depth-first
- `breadthSiblings(tree, node) {left, right}`: breadth-first

```js
var tree = {id: "A", kids: [{id: "B"}, {id: "C"}, {id: "D"}]};
var paul = new Paul(['kids']);

var nodeC = tree.kids[1];
var siblings = paul.depthSiblings(tree, nodeC);

assert.deepEqual(siblings, {
	left: [{id: "B"}],
	right: [{id: "D"}]
});
```

## Why "Paul"?

I have a history of naming awesome libraries after awesome people I know with [four](https://github.com/andrejewski/reem) [letter](https://github.com/andrejewski/matt) [names](https://github.com/andrejewski/seth). I need this library for further work with my HTML parser project [Himalaya](https://github.com/andrejewski/himalaya). Also, have you ever seen [The Fast and the Furious](http://en.wikipedia.org/wiki/The_Fast_and_the_Furious)? 

Yes, this project is dedicated to [Paul Walker](http://en.wikipedia.org/wiki/Paul_Walker).

## Contributing

We can always have more tests: if you find a bug, create an issue or be **fabulous** and fix the problem and write the tests up yourself in a coherent pull request. Same goes for documentation: typo fixes and clearer function descriptions are appreciated.

Run tests with the `npm test` command.

Follow me on [Twitter](https://twitter.com/compooter) for updates or just for the lolz and please check out my other [repositories](https://github.com/andrejewski) if I have earned it. I thank you for reading.

