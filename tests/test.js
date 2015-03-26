Tinytest.add("Sass - Working", function(test) {
  var div = document.createElement('div');
  Blaze.render(Template.testTemplate, div);
  document.body.appendChild(div);

  var elem = div.querySelector('#test-elem');

  test.equal(getStyleProperty(elem, 'display'), 'none');
  test.equal(getStyleProperty(elem, 'font-size'), '123px');

  document.body.removeChild(div);
});
