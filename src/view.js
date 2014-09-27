var partial = require('lodash-node/modern/functions/partial');
var util = require('./util');
var board = require('./board');
var drag = require('./drag');
var anim = require('./anim');

function pieceClass(p) {
  return ['cg-piece', p.role, p.color].join(' ');
}

function renderPiece(ctrl, key, p) {
  var attrs = {
    style: {},
    class: pieceClass(p)
  };
  var draggable = ctrl.data.draggable.current;
  if (draggable.orig === key && (draggable.pos[0] !== 0 || draggable.pos[1] !== 0)) {
    attrs.style = {
      webkitTransform: util.translate([
        draggable.pos[0] + draggable.dec[0],
        draggable.pos[1] + draggable.dec[1]
      ])
    };
    attrs.class += ' dragging';
  } else if (ctrl.data.animation.current.anims) {
    var animation = ctrl.data.animation.current.anims[key];
    if (animation) {
      attrs.style = {
        webkitTransform: util.translate(animation[1])
      };
    }
  }
  return {
    tag: 'div',
    attrs: attrs
  };
}

function renderGhost(p) {
  return {
    tag: 'div',
    attrs: {
      class: pieceClass(p) + ' ghost'
    }
  };
}

function renderSquare(ctrl, pos) {
  var styleX = (pos[0] - 1) * 12.5 + '%';
  var styleY = (pos[1] - 1) * 12.5 + '%';
  var file = util.files[pos[0] - 1];
  var rank = pos[1];
  var key = file + rank;
  var piece = ctrl.data.pieces[key];
  var attrs = {
    class: util.classSet({
      'cg-square': true,
      'selected': ctrl.data.selected === key,
      'check': ctrl.data.check === key,
      'last-move': util.contains2(ctrl.data.lastMove, key),
      'move-dest': util.containsX(ctrl.data.movable.dests[ctrl.data.selected], key),
      'premove-dest': util.containsX(ctrl.data.premovable.dests, key),
      'current-premove': util.contains2(ctrl.data.premovable.current, key),
      'drag-over': ctrl.data.draggable.current.over === key
    }),
    style: ctrl.data.orientation === 'white' ? {
      left: styleX,
      bottom: styleY
    } : {
      right: styleX,
      top: styleY
    }
  };
  if (pos[1] === (ctrl.data.orientation === 'white' ? 1 : 8)) attrs['data-coord-x'] = file;
  if (pos[0] === (ctrl.data.orientation === 'white' ? 8 : 1)) attrs['data-coord-y'] = rank;
  var children = [];
  if (piece) {
    children.push(renderPiece(ctrl, key, piece));
    if (ctrl.data.draggable.current.orig === key) {
      children.push(renderGhost(piece));
    }
  }
  return {
    tag: 'div',
    attrs: attrs,
    children: children
  };
}

// from mithril source, more or less
function autoredraw(callback, node) {
  return function(e) {
    m.redraw.strategy("diff");
    m.startComputation();
    var res;
    try {
      res = callback(node, e);
    } finally {
      m.endComputation();
    }
    return res;
  };
}

function renderBoard(ctrl) {
  var isTouch = util.isTouchDevice();
  var attrs = {
    class: 'cg-board',
    config: function(el, isUpdate, context) {
      if (!isUpdate) {
        ctrl.data.bounds = el.getBoundingClientRect.bind(el);
        ctrl.data.render = function() {
          m.redraw();
        };
        if (isTouch) el.addEventListener('touchstart', autoredraw(function(e) {
          drag.start(ctrl, e);
          ctrl.selectSquare(board.getKeyAtDomPos(ctrl.data, util.eventPosition(e)));
        }, el));
        document.addEventListener(isTouch ? 'touchmove' : 'mousemove', partial(drag.move, ctrl));
        document.addEventListener(isTouch ? 'touchend' : 'mouseup', partial(drag.end, ctrl));
      }
    }
  };
  if (!isTouch) {
    attrs.onmousedown = function(e) {
      if (e.button === 0) {
        drag.start(ctrl, e);
        ctrl.selectSquare(board.getKeyAtDomPos(ctrl.data, util.eventPosition(e)));
      }
    };
  }
  return {
    tag: 'div',
    attrs: attrs,
    children: util.allPos.map(partial(renderSquare, ctrl))
  };
}

module.exports = renderBoard;
