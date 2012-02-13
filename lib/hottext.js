(function($) {

  var currentDrag, isTouch, defaults;

  isTouch = typeof Touch !== 'undefined';

  defaults = {
    distance: isTouch ? 25 : 100,
    draggableClass: 'hottext_draggable',
    draggingClass: 'hottext_dragging',
    setCursor: true
  }

  $.fn.hottext = function(o) {

    this.each(function() {

      var el = $(this),
          options = $.extend({}, defaults, o, el.data()),
          content = $('<span unselectable="on" />').addClass(options.draggableClass),
          select = el.is('select') ? el : el.find('select'),
          optionElements = select.find('option'),
          currentIndex,
          timer,
          lastX;

      function updateStack(index, x) {
        var el;
        if(index === undefined) {
          index = optionElements.index(optionElements.filter(':selected'));
        }
        el = optionElements[index];
        content.html(el.innerHTML);
        el.selected = true;
        lastX = x;
        currentIndex = index;
      }

      content.insertAfter(select);
      updateStack();
      select.hide();

      if(isTouch) {

        var isTap;
        content.bind('touchstart', function(e) {
          e.preventDefault();
          lastX = e.originalEvent.pageX;
          isTap = true;
          content.trigger('hottext_start');
        });
        content.bind('touchmove', function(e) {
          e.preventDefault();
          isTap = false;
          content.trigger('hottext_drag', e.originalEvent.targetTouches[0].pageX);
        });
        content.bind('touchend', function(e) {
          e.preventDefault();
          if(isTap) {
            content.trigger('hottext_select');
            select.focus();
          } else {
            content.trigger('hottext_end');
          }
        });

      } else {

        content.mousedown(function(e) {
          lastX = e.pageX;
          currentDrag = content;
          $(document).bind('mousemove mouseup', documentHandler);
          content.trigger('hottext_start');
        });
        content.click(function() {
          content.trigger('hottext_select');
        });

      }

      select.change(function(e) {
        updateStack();
        content.show();
        select.hide();
      });

      content.bind('hottext_select', function() {
        content.hide();
        select.show();
      });

      content.bind('hottext_start', function() {
        if(options.setCursor) {
          timer = setTimeout(function() {
            $(document.body).addClass('hottext_dragging');
          }, 150);
        }
      });

      content.bind('hottext_drag', function(customEvent, pageX) {
        var offset = pageX - lastX;
        if(offset < -options.distance && currentIndex > 0) {
          updateStack(currentIndex - 1, pageX);
        } else if(offset > options.distance && currentIndex < optionElements.length - 1) {
          updateStack(currentIndex + 1, pageX);
        }
      });

      content.bind('hottext_end', function() {
        currentDrag = null;
        if(options.setCursor) {
          clearTimeout(timer);
          $(document.body).removeClass('hottext_dragging');
        }
        $(document).unbind('mousemove mouseup', documentHandler);
      });

    });
  }

  function documentHandler(e) {
    if(currentDrag) {
      if(e.type === 'mouseup' || mousemoveCanceledOutsideDocument(e)) {
        currentDrag.trigger('hottext_end');
      } else {
        currentDrag.trigger('hottext_drag', e.pageX);
      }
    }
  }

  function mousemoveCanceledOutsideDocument(e) {
    return $.browser.msie && e.type == 'mousemove' && !(document.documentMode >= 9) && !event.button;
  }

  $(document).ready(function() {
    $('.hottext').hottext();
  });

})(jQuery);
