/**
 * @file Vdom - render puzzle pieces using virtual-dom
 * @author StefanoMagrassi <stefano.magrassi@gmail.com>
 */

// Imports
// -------
import R from 'ramda';
import h from 'virtual-dom/h';
import diff from 'virtual-dom/diff';
import patch from 'virtual-dom/patch';
import createElement from 'virtual-dom/create-element';
import {mapWithIndex, pairs, propWithPx} from './utils';
import selectionManager from './selection.js';

// Exports
// -------
export default virtualdom;

// Constants
// ---------
/**
 * @constant {string} ELEMENT_TYPE - Puzzle piece html element type
 * @public
 */
export const ELEMENT_TYPE = 'span';
/**
 * @constant {string} CONTAINER_CLASS - Puzzle pieces container css class
 * @public
 */
export const CONTAINER_CLASS = '.img-puzzle_pieces';
/**
 * @constant {string} PIECE_CLASS - Puzzle piece css class
 * @public
 */
export const PIECE_CLASS = '.img-puzzle_pieces_piece';

/**
 * @func img - Gets "image" property from object.
 * @private
 * @curried
 * @return {Function}
 */
const img = R.prop('image');

/**
 * @func containerFrom - Gets the "parentNode" property from "image" element of specified data object.
 * @private
 * @curried
 * @return {Function}
 */
const containerFrom = R.compose(R.prop('parentNode'), img);

/**
 * @func src - Gets "src" property from object.
 * @private
 * @curried
 * @return {Function}
 */
const src = R.prop('src');

// Instance
// --------
/**
 * Creates a new virtualdom factory.
 * @public
 * @param {object} [spec={}} - Module instance specifications:<br/>
 *                      	     object = {
 *                       	     	onSelect: <Function> - callback on select; passes selection as parameter
 *                      	     }
 * @return {object}
 */
function virtualdom(spec = {}) {

  /**
   * @property {VTree} tree - Virtual tree of puzzle pieces.
   * @private
   */
  let tree;
  /**
   * @property {DOMNode} root - Real DOM element equivalent to virtual tree.
   * @private
   */
  let root;

  /**
   * @property {object} selection - Selection manager
   * @private
   */
  const selection = selectionManager({
    onSelect: R.prop('onSelect', spec),
    onUpdate: update
  });

  /**
   * @func selectWithIndexAnd - Curried version of selection.withIndex method.
   * @private
   * @curried
   * @return {Function}
   */
  const selectWithIndexAnd = R.curry(selection.withIndex);

  // Public API
  // ----------
  return {
    render: render,
    update: update
  };

  /**
   * Renders the virtual tree as a real DOM element.<br/>
   * Data object: {
   * 	 image: <HTMLImageElement> // Puzzle image
   * 	 rows: <Number>,           // Number of rows
   *   cols: <Number>,           // Number of columns
   *   pairs: <Array>            // Pairs of cell/item
   * }
   * @public
   * @param  {object} data - Puzzle data object
   * @return {VTree} Rendered virtual tree
   */
  function render(data) {
    tree = pieces(data);
    root = createElement(tree);

    containerFrom(data).appendChild(root);

    return tree;
  }

  /**
   * Updates the virtual tree and applies diffs to the real DOM element.
   * @public
   * @param  {object} data - Puzzle data object
   * @return {VTree} Updated virtual tree
   */
  function update(data) {
    const updatedTree = pieces(data);
    const patches     = diff(tree, updatedTree);

    root = patch(root, patches);
    tree = updatedTree;

    return tree;
  }

  /**
   * Creates the virtual-tree of puzzle pieces with virtual-hyperscript.
   * @private
   * @param  {object} data - Puzzle data object
   * @return {VTree} The virtual-tree of puzzle pieces
   */
  function pieces(data) {
    const image           = R.compose(R.pick(['src', 'width', 'height']), img);
    const appendImageData = R.append(image(data));
    const withImageData   = R.map(appendImageData);
    const children        = R.compose(mapWithIndex(piece), withImageData, pairs);

    return h(CONTAINER_CLASS, {
      onclick   : selectWithIndexAnd(data),
      ontouchend: selectWithIndexAnd(data)
    }, children(data));
  }

  /**
   * Create the virtual-element of puzzle piece with virtual-hyperscript.
   * @private
   * @param  {array}  data  - Pair of cell/item objects with image data
   * @param  {number} index - Item index
   * @return {VTree}  The virtual-element of puzzle piece
   */
  function piece(data, index) {
    const [cell, item, image] = data;

    return h(`${ELEMENT_TYPE}${PIECE_CLASS}`, {
      puzzle_index: index,
      className   : selection.toggleClass(index),
      style       : {
        width             : propWithPx('width', cell),
        height            : propWithPx('height', cell),
        backgroundImage   : `url(${src(image)})`,
        backgroundPosition: bgPosition(item),
        backgroundSize    : bgSize(image),
        left              : propWithPx('x', cell),
        top               : propWithPx('y', cell)
      }
    });
  }
}

/**
 * Returns the background-position property's value from item.
 * @private
 * @param  {object} item - Item object
 * @return {string} Background-position value
 */
function bgPosition(item) {
  return `${propWithPx('bgX', item)} ${propWithPx('bgY', item)}`;
}

/**
 * Returns the background-size property's value from item.
 * @private
 * @param  {object} image - Image data object
 * @return {string} Background-size value
 */
function bgSize(image) {
  return `${propWithPx('width', image)} ${propWithPx('height', image)}`;
}