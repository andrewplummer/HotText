function triggerLabelClick(instance) {
  instance.handleAreaMousedown({ clientX: 0, clientY: 0 });
  instance.handleDocumentMouseup({ clientX: 0, clientY: 0 });
}

function triggerInputKeydown(instance, code) {
  instance.handleInputKeydown({ keyCode: code });
}

function mockEvent(obj) {
  var evt = {
    preventDefault: function() {},
    stopPropagation: function() {},
    stopImmediatePropagation: function() {}
  }
  for(var key in obj) {
    if(!obj.hasOwnProperty(key)) continue;
    evt[key] = obj[key];
  }
  return evt;
}

function mockTouchEvent(obj) {
  return mockEvent({ touches: [obj] });
}

function withDocumentLang(lang, fn) {
  var was = document.documentElement.lang;
  document.documentElement.lang = lang;
  fn();
  document.documentElement.lang = was;
}
