jQuery(function($) {


  function escapeHTML(html) {
    var len;
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/( {2}|\t)+/g, function(tab) {
        if(!len) {
          len = tab.length;
          return '  ';
        } else {
          return tab.slice(len - 2);
        }
      });
  }

  function getFilteredHTML($el) {
    var el = $el[0], i, attr, str, attrs = [], tag = el.tagName.toLowerCase();
    str = '<' + tag;
    for(i = 0; i < el.attributes.length; i++) {
      attr = el.attributes.item(i);
      if(attr.nodeName.match(/^data|src/)) {
        attrs.push(attr.nodeName + '="' + attr.nodeValue + '"');
      }
    }
    if(attrs.length > 0) {
      str += ' ' + attrs.join(' ');
    }
    if(tag == 'script') {
      str += ' />';
    } else {
      str += '>' + el.innerHTML + '<' + tag + '>';
    }
    return escapeHTML(str);
  }

  $('.demo').each(function() {

    var el = $(this),
        pre = $('<pre/>');

    pre.html(getFilteredHTML(el)).insertBefore(el);
    pre.addClass('sh_html');

  });

  sh_highlightDocument();

});
