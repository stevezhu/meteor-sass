Tinytest.add("Sass - Working", function(test) {
  var div = document.createElement('div');
  Blaze.render(Template.testTemplate, div);
  document.body.appendChild(div);

  var elem = div.querySelector('#test-elem');
  test.equal(getStyleProperty(elem, 'display'), 'none');
  test.equal(getStyleProperty(elem, 'border-width'), '1px');
  test.equal(getStyleProperty(elem, 'border-style'), 'solid');

  document.body.removeChild(div);
});
