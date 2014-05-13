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
    draggingClass: 'hottext-dragging',
    invalidClass:  'hottext-invalid',
    labelClass:    'hottext-label',
    areaClass:     'hottext-hit-area',
    separateThousands: true,
    thousandsSeparator: ',',
    decimalPoint: '.'
  };


  // DOM Helpers (replaced below by jQuery) --

  function removeElement(el) {
    el.remove();
  }

  function getText(el) {
    return el.textContent;
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
      getText          = jqGetText;
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

  function jqGetText(el) {
    return $(el).text();
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
    this.setupInput();
    this.buildElements();
    this.setupEventHandlers();
    this.initInput();
    this.toggleInputActive(false);
  }



  // Global variables ---------

  HotText.instances = [];



  // Global methods -----------

  HotText.initializeAll = function(selector) {
    checkShim();
    var els = querySelectorAll(selector || 'input[type="number"]');
    forEach(els, function(el) {
      this.instances.push(new HotText(el));
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
    this.updateLabel();

    this.input.parentNode.insertBefore(this.area, this.input);
    this.area.appendChild(this.label);
    this.area.appendChild(this.input);
  };

  HotText.prototype.setupInput = function() {
    this.isSelectBox = this.input.nodeName === 'SELECT';
    this.isNumeric = !this.isSelectBox;
    this.suffix = this.getSuffix();
    this.value = this.getValue();
    this.storedInputDisplay = this.input.style.display;
  };

  HotText.prototype.initInput = function() {
    if(this.isNumeric && isNaN(this.value)) {
      this.update(0);
    }
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

  HotText.prototype.getSuffix = function() {
    return this.isSelectBox ? '' : this.input.value.replace(/^[\d.]+/, '');
  };

  HotText.prototype.getValue = function() {
    return this.isSelectBox ? this.input.value : parseFloat(this.input.value.replace(/,/g, ''));
  };

  HotText.prototype.update = function(valueOrIndex) {
    if(this.isNumeric) {
      valueOrIndex = Math.min(this.options.maximum, valueOrIndex);
      valueOrIndex = Math.max(this.options.minimum, valueOrIndex);
    }
    this.setInput(valueOrIndex);
    this.updateLabel();
  };

  HotText.prototype.setInput = function(valueOrIndex) {
    if(this.isSelectBox) {
      this.input.selectedIndex = valueOrIndex;
    } else {
      this.value = valueOrIndex;
    }
  };

  HotText.prototype.updateLabel = function() {
    var str;
    if(this.isNumeric) {
      str = this.getFormattedValue() + this.suffix;
      // Update the input as well as it's string form
      // may differ from the numeric value.
      this.input.value = str;
    } else {
      str = getText(this.input.options[this.input.selectedIndex]);
    }
    setText(this.label, str);
  };

  HotText.prototype.validateInput = function(evt) {
    var value = this.getValue();
    if(isNaN(value)) {
      addClass(this.input.parentNode, this.options.invalidClass);
    } else {
      this.update(value);
      removeClass(this.input.parentNode, this.options.invalidClass);
      this.toggleInputActive(false);
    }
  };

  HotText.prototype.toggleInputActive = function(on) {
    if(this.inputIsActive === on) {
      return;
    }
    this.inputIsActive = on;
    this.toggleElementVisibility(this.input, on);
    this.toggleElementVisibility(this.label, !on);
    if(on) {
      this.isSelectBox ? this.input.focus() : this.input.select();
    }
  };

  HotText.prototype.toggleElementVisibility = function(el, on) {
    var display;
    if(on) {
      display = el === this.input ? this.storedInputDisplay : '';
      el.style.display = display;
    } else {
      el.style.display = 'none';
    }
  };

  HotText.prototype.destroy = function() {
    this.forEachHandler(function(name, el, event) {
      if(el !== document) {
        removeEvent(el, event, this[name]);
      }
      removeClass(this.input.parentNode, this.options.invalidClass);
      removeElement(this.label);
      this.toggleElementVisibility(this.input, true);
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

  HotText.prototype.getValueForOffset = function(offset) {
    return this.isNumeric
      ? this.getNumericValueForOffset(offset)
      : this.getSelectIndexForOffset(offset);
  };

  HotText.prototype.getNumericValueForOffset = function(offset) {
    var val = this.startValueOrIndex + offset;
    var mult = Math.pow(10, this.precision);
    return Math.round(val * mult) / mult;
  };

  HotText.prototype.getSelectIndexForOffset = function(offset) {
    return Math.max(0, Math.min(this.input.length - 1, this.startValueOrIndex + offset));
  };

  HotText.prototype.getStartValueOrIndex = function() {
    return this.isSelectBox ? this.input.selectedIndex : this.value;
  };

  // Events --------------------------


  HotText.prototype.dragStart = function(evt) {
    this.isDragging = false;
    this.startValueOrIndex = this.getStartValueOrIndex();
    this.startX     = this.getEventObject(evt).clientX;
    addClass(doc, this.options.draggingClass);
  };

  HotText.prototype.drag = function(evt) {
    this.isDragging = true;
    var delta = (this.getEventObject(evt).clientX - this.startX) / this.options.dragDistance;
    this.update(this.getValueForOffset(delta));
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
      if(el !== document) {
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
    if(this.inputIsActive) return;
    this.dragStart(evt);
    addEvent(doc, 'mousemove', this.handleDocumentMousemove);
    addEvent(doc, 'mouseup', this.handleDocumentMouseup);
  };

  HotText.prototype.handleDocumentMousemove = function(evt) {
    if(this.inputIsActive) return;
    this.drag(evt);
  };

  HotText.prototype.handleDocumentMouseup = function(evt) {
    if(this.inputIsActive) return;
    this.dragEnd(evt);
    removeEvent(doc, 'mousemove', this.handleDocumentMousemove);
    removeEvent(doc, 'mouseup', this.handleDocumentMouseup);
  };

  HotText.prototype.handleInputKeydown = function(evt) {
    if(evt.keyCode === this.options.confirmKeyCode) {
      evt.preventDefault();
      this.input.blur();
    } else if(evt.keyCode === this.options.cancelKeyCode) {
      evt.preventDefault();
      this.update(this.value);
      this.input.blur();
    }
  };

  HotText.prototype.handleInputChange = function(evt) {
    if(this.isSelectBox) {
      this.updateLabel();
      this.toggleInputActive(false);
    }
  };

  HotText.prototype.handleInputBlur = function(evt) {
    if(this.isNumeric) {
      this.validateInput();
    } else if(this.isSelectBox) {
      this.toggleInputActive(false);
    }
  };

  HotText.prototype.handleInputFocus = function(evt) {
    this.toggleInputActive(true);
  };




  // Exports --------------

  if(typeof module !== 'undefined' && module.exports) {
    module.exports = HotText;
  } else {
    context.HotText = HotText;
  }

})(this, jQuery);
