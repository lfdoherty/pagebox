
var page = require('page')

var whittle = require('whittle')

var buttonHasBeenClicked = false

var refreshPage = whittle.page(function(h){
	h.h1().text('Hello World').e()
	h.button()
		.clazz('ok')
		.text('Click Me')
		.click(function(){
			buttonHasBeenClicked = true
			refreshPage()
		})
	.e()
	
	if(buttonHasBeenClicked){
		h.p()
			.clazz('msg')
			.text('Thanks for clicking the button!')
		.e()
	}
})
