
/*

Note that we're testing with plantbox, not pagebox, since the aspects of a page that are testable
are in the plant, not the page.  The page adds CSS, server-side stuff, etc., which are either
not testable or are tested in other ways.

*/

var plantbox = require('plantbox')(module)

var test = require("tap").test

var indexPlant = plantbox('./../js/indexplant')

test('make sure OK button works properly', function(t){

	var plant = indexPlant.run()

	plant.click('.ok')
	t.ok(plant.exists('.msg'), 'Clicking OK should cause a message to show.')

	plant.end()	
	t.end()
})

