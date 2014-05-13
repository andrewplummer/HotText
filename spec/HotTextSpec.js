describe('HotText', function() {

  var input, instance, label, area;
  var doc = $(document.documentElement);

  function injectHTML(html) {
    return $(html).appendTo('#fixtures');
  }

  function setupInstance(html) {
    input = injectHTML(html);
    instance = new HotText(input[0]);
    area = input.parent();
    label = input.prev();
  }

  function mouseDragLabel(x, y, touch) {
    y = y || 0;
    instance.handleAreaMousedown(mockEvent({ clientX: 0, clientY: 0 }));
    instance.handleDocumentMousemove(mockEvent({ clientX: x, clientY: y }));
    instance.handleDocumentMouseup(mockEvent({ clientX: x, clientY: y }));
  }

  function touchDragLabel(x, y) {
    y = y || 0;
    instance.handleAreaTouchstart(mockTouchEvent({ clientX: 0, clientY: 0 }));
    instance.handleDocumentTouchmove(mockTouchEvent({ clientX: x, clientY: y }));
    instance.handleDocumentTouchend(mockTouchEvent({ clientX: x, clientY: y }));
  }

  function assertInputIsActive(inputActive) {
    expect(area.hasClass('hottext-active')).toEqual(inputActive);
  }

  function assertCurrentLabelValueIs(val) {
    expect(label.text()).toEqual(val);
    expect(input.val()).toEqual(val);
  }

  afterEach(function() {
    HotText.destroyAll();
    $('#fixtures').empty();
  });

  it('should initialize a span and hide itself', function() {
    setupInstance('<input type="number" value="100">');
    assertCurrentLabelValueIs('100');
    assertInputIsActive(false);
  });

  it('should show and focus the input when clicked', function() {
    setupInstance('<input value="100">');
    triggerLabelClick(instance);
    assertInputIsActive(true);
    expect(input.is(':focus')).toEqual(true);
    expect(input.selection()).toEqual('100');
  });

  it('should validate and hide the input on enter key', function() {
    setupInstance('<input value="100">');
    triggerLabelClick(instance);
    instance.handleInputKeydown(mockEvent({ keyCode: 13 }));
    assertInputIsActive(false);
  });

  it('should cancel and hide the input on esc key', function() {
    setupInstance('<input value="100">');
    triggerLabelClick(instance);
    input.val('300px');
    instance.handleInputKeydown(mockEvent({ keyCode: 27 }));
    assertInputIsActive(false);
    expect(input.val()).toBe('100');
  });

  it('should not revert to before drag on esc key', function() {
    setupInstance('<input value="100">');
    mouseDragLabel(100000);
    assertCurrentLabelValueIs('1,100');
    triggerLabelClick(instance);
    input.val('300');
    instance.handleInputKeydown(mockEvent({ keyCode: 27 }));
    assertInputIsActive(false);
    assertCurrentLabelValueIs('1,100');
  });

  it('should validate and hide the input when blurred', function() {
    setupInstance('<input value="100">');
    triggerLabelClick(instance);
    instance.handleInputBlur();
    assertInputIsActive(false);
  });

  it('should be able to cap minimum values', function() {
    setupInstance('<input value="100" data-minimum="0">');
    mouseDragLabel(-100000);
    assertCurrentLabelValueIs('0');
  });

  it('should be able to cap maximum values', function() {
    setupInstance('<input value="100" data-maximum="10">');
    mouseDragLabel(100000);
    assertCurrentLabelValueIs('10');
  });

  it('should repsect precision passed in by options', function() {
    setupInstance('<input value="100.25" data-precision="0">');
    assertCurrentLabelValueIs('100');
  });

  it('should not hide the input when value is not valid', function() {
    setupInstance('<input value="100">');
    triggerLabelClick(instance);
    input.val('not a number');
    instance.validateInput();
    assertInputIsActive(true);
    expect(input.parent().hasClass('hottext-invalid')).toEqual(true);
    input.val('300px');
    instance.validateInput();
    assertInputIsActive(false);
    expect(input.parent().hasClass('hottext-invalid')).toEqual(false);
  });

  it('should handle non-number values', function() {
    setupInstance('<input type="text" value="100px">');
    assertCurrentLabelValueIs('100px');
  });

  it('should separate thousands by default', function() {
    setupInstance('<input type="text">');
    mouseDragLabel(1000000);
    assertCurrentLabelValueIs('10,000');
  });

  it('should not separate thousands for number type', function() {
    setupInstance('<input type="number">');
    mouseDragLabel(1000000);
    assertCurrentLabelValueIs('10000');
  });

  it('should allow a custom thousands and decimal', function() {
    setupInstance('<input type="text" value="10.45px" data-thousands-separator=" " data-decimal-point=",">');
    mouseDragLabel(100000);
    assertCurrentLabelValueIs('1 010,45px');
  });

  it('should take lang attribute into account for formatting', function() {
    setupInstance('<input type="text" lang="ru" value="1.50">');
    mouseDragLabel(10);
    assertCurrentLabelValueIs('1,60');
  });

  it('should traverse the document to find lang attribute', function() {
    withDocumentLang('ru', function() {
      setupInstance('<input type="text" value="1.50">');
      mouseDragLabel(10);
      assertCurrentLabelValueIs('1,60');
    });
  });

  it('should not put a thousands separator for negative 3 digit numbers', function() {
    setupInstance('<input type="text">');
    mouseDragLabel(-10000);
    assertCurrentLabelValueIs('-100');
  });

  it('should be able to disable thousands separator', function() {
    setupInstance('<input type="text" data-separate-thousands="false">');
    mouseDragLabel(100000);
    assertCurrentLabelValueIs('1000');
  });

  it('should restore a display style if initially set', function() {
    setupInstance('<input style="display:inline-block" value="100">');
    triggerLabelClick(instance);
    expect(input[0].style.display).toEqual('inline-block');
  });

  it('should change values when dragging x', function() {
    setupInstance('<input value="100">');
    mouseDragLabel(100);
    assertCurrentLabelValueIs('101');
    mouseDragLabel(100);
    assertCurrentLabelValueIs('102');
    mouseDragLabel(200);
    assertCurrentLabelValueIs('104');
    mouseDragLabel(-350);
    assertCurrentLabelValueIs('101');
  });

  it('should be able to override classes', function() {
    setupInstance('<input value="100" data-label-class="foobar" data-dragging-class="boobar" data-invalid-class="moobar">');
    expect(label.hasClass('foobar')).toEqual(true);
    instance.handleAreaMousedown(mockEvent({ clientX: 0, clientY: 0 }));
    instance.handleDocumentMousemove(mockEvent({ clientX: 10, clientY: 10 }));
    expect(doc.hasClass('boobar')).toEqual(true);
    input.val('not a number');
    instance.validateInput();
    expect(input.parent().hasClass('moobar')).toEqual(true);
  });

  it('should be able to optionally set drag distance', function() {
    setupInstance('<input value="100" data-drag-distance="50">');
    mouseDragLabel(100);
    assertCurrentLabelValueIs('102');
  });

  it('should not change values when dragging y', function() {
    setupInstance('<input value="100">');
    mouseDragLabel(0, 500);
    assertCurrentLabelValueIs('100');
  });

  it('should add a suffix when exists', function() {
    setupInstance('<input type="text" value="100px">');
    mouseDragLabel(100);
    assertCurrentLabelValueIs('101px');
  });

  it('should add a suffix with a space', function() {
    setupInstance('<input type="text" value="3 bananas">');
    mouseDragLabel(500);
    assertCurrentLabelValueIs('8 bananas');
  });

  it('should round integer values', function() {
    setupInstance('<input value="53">');
    mouseDragLabel(40);
    assertCurrentLabelValueIs('53');
    mouseDragLabel(40);
    assertCurrentLabelValueIs('53');
    mouseDragLabel(40);
    assertCurrentLabelValueIs('53');
    mouseDragLabel(100);
    assertCurrentLabelValueIs('54');
  });

  it('should not round floating values', function() {
    setupInstance('<input value="53.25">');
    mouseDragLabel(20);
    assertCurrentLabelValueIs('53.45');
  });

  it('should not round even floating values', function() {
    setupInstance('<input value="100.00">');
    mouseDragLabel(20);
    assertCurrentLabelValueIs('100.20');
  });

  it('should update the label text when value is changed', function() {
    setupInstance('<input value="100.00">');
    triggerLabelClick(instance);
    input.val(300);
    instance.validateInput();
    assertCurrentLabelValueIs('300.00');
  });

  it('should not open after dragging', function() {
    setupInstance('<input value="100.00">');
    instance.handleAreaMousedown(mockEvent({ clientX: 0, clientY: 0 }));
    instance.handleDocumentMousemove(mockEvent({ clientX: 100, clientY: 0 }));
    instance.handleDocumentMousemove(mockEvent({ clientX: 0, clientY: 0 }));
    instance.handleDocumentMouseup(mockEvent({ clientX: 0, clientY: 0 }));
    assertInputIsActive(false);
  });

  it('should respond to touch events', function() {
    setupInstance('<input value="100">');
    touchDragLabel(100);
    assertCurrentLabelValueIs('101');
    touchDragLabel(100);
    assertCurrentLabelValueIs('102');
    touchDragLabel(200);
    assertCurrentLabelValueIs('104');
    touchDragLabel(-350);
    assertCurrentLabelValueIs('101');
  });

  it('should be able to find all instances', function() {
    injectHTML('<input value="1"><input value="5"><input value="10px">');
    HotText.initializeAll();
    expect(HotText.instances.length).toEqual(3);
    expect(HotText.instances[0].value).toEqual(1);
    expect(HotText.instances[1].value).toEqual(5);
    expect(HotText.instances[2].value).toEqual(10);
  });

  it('should be able to destroy all instances', function() {
    injectHTML('<input value="1"><input value="5"><input value="10px">');
    HotText.initializeAll();
    HotText.destroyAll();
    expect($('.hottext-label').length).toEqual(0);
  });

});
