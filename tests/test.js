// sass added using api.addFiles
Tinytest.add("Sass - Sass files", function(test) {
	var renderedTemplate = UI.render(Template.testTemplate);
	UI.insert(renderedTemplate, document.body);

	var elem = document.getElementById('test-elem');
	test.equal(getStyleProperty(elem, 'display'), 'none', "Expected display: none;")

	UI.remove(renderedTemplate);
});

Tinytest.add("Sass - Partials", function(test) {
	var renderedTemplate = UI.render(Template.testTemplate);
	UI.insert(renderedTemplate, document.body);

	var elem = document.getElementById('test-elem');
	test.equal(getStyleProperty(elem, 'content'), 'partial', "Expected content: partial;")

	UI.remove(renderedTemplate);
});
