(function(context) {
  'use strict';

  var hasTouch = 'ontouchstart' in document.documentElement;
  var numberFormat = typeof Intl !== 'undefined' ? Intl.NumberFormat : undefined;
  var doc = document.documentElement;

  var DEFAULTS = {
    maximum: Infinity,
    minimum: -Infinity,
    confirmKeyCode: 13,
    cancelKeyCode:  27,
    dragDistance:   hasTouch ? 25 : 100,
    activeClass:   'hottext-active',
    draggingClass: 'hottext-dragging',
    invalidClass:  'hottext-invalid',
    labelClass:    'hottext-label',
    inputClass:    'hottext-input',
    areaClass:     'hottext-hit-area',
    separateThousands: true,
    thousandsSeparator: ',',
    decimalPoint: '.'
  };


  // DOM Helpers (replaced below by jQuery) --

  function removeElement(el) {
    el.remove();
  }

  function setText(el, text) {
    el.textContent = text;
  }

  function addClass(el, name) {
    return el.classList.add(name);
  }

  function removeClass(el, name) {
    return el.classList.remove(name);
  }

  function getDataset(el) {
    var result = {}, data = el.dataset, val, num;
    for (var key in data) {
      val = data[key];
      num = parseFloat(val);
      if(val === 'false') {
        val = false;
      } else if(val === 'true') {
        val = true;
      } else if(!isNaN(num)) {
        val = num;
      }
      result[key] = val;
    }
    return result;
  }

  function querySelectorAll(str) {
    return document.querySelectorAll(str);
  }

  function addEvent(el, name, handler) {
    el.addEventListener(name, handler, false);
  }

  function removeEvent(el, name, handler) {
    el.removeEventListener(name, handler, false);
  }

  function bindFunction(fn, context) {
    return fn.bind(context);
  }

  // jQuery shim - remove this block if you don't need < IE9 support ----

  var shimmed = false;

  function checkShim() {
    if(!shimmed && context.$ && !hasSupport()) {
      removeElement    = jqRemoveElement;
      setText          = jqSetText;
      addClass         = jqAddClass;
      removeClass      = jqRemoveClass;
      getDataset       = jqGetDataset;
      querySelectorAll = jqQuerySelectorAll;
      addEvent         = jqAddEvent;
      removeEvent      = jqRemoveEvent;
      bindFunction     = jqBindFunction;
      shimmed = true;
    }
  }

  function hasSupport() {
    var doc = document.documentElement;
    return Function.bind &&
      doc.remove &&
      doc.dataset &&
      doc.classList &&
      doc.textContent &&
      doc.querySelectorAll &&
      doc.addEventListener;
  }

  function jqRemoveElement(el) {
    $(el).remove();
  }

  function jqSetText(el, text) {
    $(el).text(text);
  }

  function jqAddClass(el, name) {
    $(el).addClass(name);
  }

  function jqRemoveClass(el, name) {
    $(el).removeClass(name);
  }

  function jqGetDataset(el) {
    return $(el).data();
  }

  function jqQuerySelectorAll(str) {
    return $(str);
  }

  function jqAddEvent(el, name, handler) {
    return $(el).on(name, handler);
  }

  function jqRemoveEvent(el, name, handler) {
    return $(el).off(name, handler);
  }

  function jqBindFunction(fn, context) {
    return $.proxy(fn, context);
  }


  // General helpers --------------

  function mergeDefaults(obj1, obj2) {
    for (var key in obj2) {
      if(!obj1.hasOwnProperty(key)) {
        obj1[key] = obj2[key];
      }
    }
    return obj1;
  }

  function forEach(arr, fn, context) {
    for (var i = 0, len = arr.length; i < len; i++) {
      fn.call(context, arr[i], i);
    }
  }


  // HotText -------------------

  function HotText(input) {
    checkShim();
    this.input = input;
    this.setupDefaults();
    this.buildElements();
    this.setupInput();
    this.setupEventHandlers();
  }



  // Global variables ---------

  HotText.instances = [];



  // Global methods -----------

  HotText.initializeAll = function(selector) {
    checkShim();
    var els = querySelectorAll(selector || 'input');
    forEach(els, function(el) {
      if(el.type === 'text' || el.type === 'number') {
        this.instances.push(new HotText(el));
      }
    }, this);
  };

  HotText.destroyAll = function() {
    forEach(this.instances, function(i) {
      i.destroy();
    }, this);
    this.instances = [];
  };


  // Setup ------------------

  HotText.prototype.setupDefaults = function() {
    this.options = mergeDefaults(getDataset(this.input), DEFAULTS);
    this.locale = this.getLocale();
    this.precision = this.getPrecision();
  };

  HotText.prototype.buildElements = function() {

    // Build hit area
    this.area = document.createElement('span');
    addClass(this.area, this.options.areaClass);

    // Build label
    this.label = document.createElement('span');
    addClass(this.label, this.options.labelClass);
    setText(this.label, this.input.value);

    // Build input
    addClass(this.input, this.options.inputClass);

    this.input.parentNode.insertBefore(this.area, this.input);
    this.area.appendChild(this.label);
    this.area.appendChild(this.input);
  };

  HotText.prototype.setupInput = function() {
    this.suffix = this.input.value.replace(/^[\d.]+/, '');
    this.value = this.getValue();
    this.setValue(isNaN(this.value) ? 0 : this.value);
    this.storedInputDisplay = this.input.style.display;
    this.toggleInputActive(false);
  };

  HotText.prototype.getLocale = function() {
    var el = this.input, lang;
    while(el && !lang) {
      lang = el.lang;
      el = el.parentNode;
    }
    return lang || 'en';
  };

  HotText.prototype.getPrecision = function() {
    var precision = this.options.precision;
    if(isNaN(precision)) {
      var match = this.input.value.match(/\.(\d+)/);
      precision = match && match[1].length || 0;
    }
    return precision;
  };


  // Actions -------------------------

  HotText.prototype.setValue = function(val) {
    val = Math.min(this.options.maximum, val);
    val = Math.max(this.options.minimum, val);
    this.value = val;
    this.updateLabel();
  };

  HotText.prototype.getValue = function() {
    return parseFloat(this.input.value.replace(/,/g, ''));
  };

  HotText.prototype.updateLabel = function() {
    var str = this.getFormattedValue() + this.suffix;
    this.input.value = str;
    setText(this.label, str);
  };

  HotText.prototype.validateInput = function(evt) {
    var value = this.getValue();
    if(isNaN(value)) {
      addClass(this.input.parentNode, this.options.invalidClass);
    } else {
      this.setValue(value);
      removeClass(this.input.parentNode, this.options.invalidClass);
      this.toggleInputActive(false);
    }
  };

  HotText.prototype.toggleInputActive = function(on) {
    this.inputIsActive = on;
    if(on) {
      addClass(this.area, this.options.activeClass);
      this.input.select();
    } else {
      removeClass(this.area, this.options.activeClass);
    }
  };

  HotText.prototype.destroy = function() {
    this.forEachHandler(function(name, el, event) {
      if(el !== document) {
        removeEvent(el, event, this[name]);
      }
      removeClass(this.input.parentNode, this.options.invalidClass);
      removeElement(this.label);
      this.toggleInputActive(false);
    });
  };


  // Options -------------------------

  HotText.prototype.usesCustomFormatting = function() {
    return this.options.thousandsSeparator !== DEFAULTS.thousandsSeparator &&
           this.options.decimalPoint !== DEFAULTS.decimalPoint;
  };

  HotText.prototype.canSeparateThousands = function() {
    return this.options.separateThousands && this.input.type !== 'number';
  };

  HotText.prototype.getFormattedValue = function() {
    if(!this.canSeparateThousands()) {
      return this.value.toString();
    } else if(numberFormat && !this.usesCustomFormatting()) {
      return new numberFormat(this.locale, {
        minimumFractionDigits: this.precision,
        maximumFractionDigits: this.precision
      }).format(this.value);
    } else {
      var str;
      var split = this.value.toFixed(this.precision).split('.');
      var integer   = split[0].replace(/-/, '');
      var fraction  = split[1];
      var thousands = [];
      for (var i = integer.length - 3; i > -3; i -= 3) {
        thousands.push(integer.slice(Math.max(0, i), i + 3));
      }
      str = this.value < 0 ? '-' : '';
      str += thousands.reverse().join(this.options.thousandsSeparator);
      if(fraction) {
        str += this.options.decimalPoint + fraction;
      }
      return str;
    }
  };


  // Events --------------------------


  HotText.prototype.dragStart = function(evt) {
    this.isDragging = false;
    this.startValue = this.value;
    this.startX     = this.getEventObject(evt).clientX;
    addClass(doc, this.options.draggingClass);
  };

  HotText.prototype.drag = function(evt) {
    this.isDragging = true;
    var delta = (this.getEventObject(evt).clientX - this.startX) / this.options.dragDistance;
    var val = this.startValue + delta;
    var mult = Math.pow(10, this.precision);
    val = Math.round(val * mult) / mult;
    this.setValue(val);
  };

  HotText.prototype.dragEnd = function(evt) {
    if(!this.isDragging) {
      this.toggleInputActive(!this.inputIsActive);
    }
    this.isDragging = false;
    removeClass(doc, this.options.draggingClass);
  };

  HotText.prototype.getEventObject = function(evt) {
    return evt.touches ? evt.touches[0] : evt;
  };



  // Event Handlers ------------------

  HotText.prototype.setupEventHandlers = function() {
    this.forEachHandler(function(name, el, event) {
      this[name] = bindFunction(this[name], this);
      if(el && el !== document) {
        addEvent(el, event, this[name]);
      }
    });
  };

  HotText.prototype.forEachHandler = function(fn) {
    var name, match;
    for (name in this) {
      match = name.match(/^handle([A-Z][a-z]+)([A-Z][a-z]+)$/);
      if(match) {
        var prop = match[1].toLowerCase();
        var event = match[2].toLowerCase();
        var el = this[prop] || window[prop];
        fn.call(this, name, el, event);
      }
    }
  };

  HotText.prototype.handleAreaTouchstart = function(evt) {
    evt.preventDefault();
    this.dragStart(evt);
    addEvent(doc, 'touchmove', this.handleDocumentTouchmove);
    addEvent(doc, 'touchend', this.handleDocumentTouchend);
  };

  HotText.prototype.handleDocumentTouchmove = function(evt) {
    evt.preventDefault();
    this.drag(evt);
  };

  HotText.prototype.handleDocumentTouchend = function(evt) {
    this.dragEnd(evt);
    removeEvent(doc, 'touchmove', this.handleDocumentTouchmove);
    removeEvent(doc, 'touchend', this.handleDocumentTouchend);
  };

  HotText.prototype.handleAreaMousedown = function(evt) {
    this.dragStart(evt);
    addEvent(doc, 'mousemove', this.handleDocumentMousemove);
    addEvent(doc, 'mouseup', this.handleDocumentMouseup);
    this.attachSelectStart();
  };

  HotText.prototype.handleDocumentMousemove = function(evt) {
    this.drag(evt);
  };

  HotText.prototype.handleDocumentMouseup = function(evt) {
    this.dragEnd(evt);
    removeEvent(doc, 'mousemove', this.handleDocumentMousemove);
    removeEvent(doc, 'mouseup', this.handleDocumentMouseup);
    this.detachSelectStart();
  };

  HotText.prototype.handleInputKeydown = function(evt) {
    if(evt.keyCode === this.options.confirmKeyCode) {
      evt.preventDefault();
      this.input.blur();
    } else if(evt.keyCode === this.options.cancelKeyCode) {
      evt.preventDefault();
      this.setValue(this.value);
      this.input.blur();
    }
  };

  HotText.prototype.handleInputBlur = function(evt) {
    this.validateInput();
  };


  // IE Methods for preventing text selection

  HotText.prototype.attachSelectStart = function(evt) {
    if(document.attachEvent) {
      document.attachEvent('onselectstart', this.handleSelectStart);
    }
  };

  HotText.prototype.detachSelectStart = function(evt) {
    if(document.detachEvent) {
      document.detachEvent('onselectstart', this.handleSelectStart);
    }
  };

  HotText.prototype.handleSelectStart = function(evt) {
    return false;
  };




  // Exports --------------

  if(typeof module !== 'undefined' && module.exports) {
    module.exports = HotText;
  } else {
    context.HotText = HotText;
  }

})(this, jQuery);
