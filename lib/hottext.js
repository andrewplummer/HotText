(function($) {

  var currentDrag;

  var defaults = {
    distance: 100,
    draggableClass: 'hottext_draggable',
    draggingClass: 'hottext_dragging',
    setCursor: true
  }

  $.fn.hottext = function(o) {

    this.each(function() {

      var el = $(this),
          options = $.extend({}, defaults, o, el.data()),
          content = $('<span/>').addClass(options.draggableClass),
          select = el.is('select') ? el : el.find('select'),
          optionElements = select.find('option'),
          currentIndex,
          timer,
          lastX;

      function updateStack(index, x) {
        if(index === undefined) {
          index = optionElements.index(optionElements.filter(':selected'));
        }
        var el;
        el = optionElements[index];
        content.html(el.innerHTML);
        el.selected = true;
        lastX = x;
        currentIndex = index;
      }

      content.insertAfter(select);
      updateStack();
      select.hide();

      content.mousedown(function(e) {
        lastX = e.pageX;
        currentDrag = content;
        if(options.setCursor) {
          timer = setTimeout(function() {
            $(document.body).addClass('hottext_dragging');
          }, 150);
        }
        $(document).bind('mousemove mouseup', documentHandler);
      });

      content.click(function() {
        content.hide();
        select.show();
      });

      select.change(function(e) {
        updateStack();
        content.show();
        select.hide();
      });

      // Prevent selecting in < IE8
      content.bind('selectstart', function(e) {
        e.preventDefault();
      });

      content.bind('hottext_mousemove', function(customEvent, windowEvent) {
        var pageX = windowEvent.pageX, offset = pageX - lastX;
        if(offset < -options.distance && currentIndex > 0) {
          updateStack(currentIndex - 1, pageX);
        } else if(offset > options.distance && currentIndex < optionElements.length - 1) {
          updateStack(currentIndex + 1, pageX);
        }
      });

      content.bind('hottext_mouseup', function() {
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
      if(mousemoveCanceledOutsideDocument(e)) {
        currentDrag.trigger('hottext_mouseup');
      } else {
        currentDrag.trigger('hottext_' + e.type, e);
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
