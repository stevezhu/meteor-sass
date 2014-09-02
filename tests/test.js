Tinytest.add("Sass - Is working", function(test) {
	var renderedTemplate = UI.render(Template.testTemplate);
	UI.insert(renderedTemplate, document.body);

	var elem = document.getElementById('test-elem');
	test.equal(getStyleProperty(elem, 'display'), 'none', "Expected display: none;")

	UI.remove(renderedTemplate);
});
