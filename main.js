
var pathModule = require('path')
var fs = require('fs')
var http = require('http')

var request = require('request')

var plantbox = require('plantbox')

var _ = require('underscorem')

var ParamsStartStr = 'page.params = {'

var j = request.jar()
var req = request.defaults({jar: j})
/*
global.document = {
	addEventListener: function(){
	}
}
global.window = {
	addEventListener: function(){
	}
}*/

module.exports = function(module){

	var pb = plantbox(module)
	
	return function(plantPath, serverPath){
		_.assertString(plantPath)
		_.assertString(serverPath)

		var windowPath = './windowmodule.js'
		
		var dynamicsToCache = []
		
		function srcCb(path, src){
			src = 'var windowModule = require("'+windowPath+'");(function(window, document){'+src+
				'})(windowModule, windowModule.document)'
			return src
		}
		
		
		function externalBeforeResolveCb(reqName, sourcePath, sourceSrc){
			if(reqName[0] === ':'){

				var path = './'+reqName.substr(1)
				dynamicsToCache.push({name: reqName.substr(1), path: path})
				
				//throw new Error('TODO: ' + reqName)
				console.log('need to cache: ' + reqName)
				return {path: path, noGeneration: true}
			}
		}

		var overlayPlantMaker = pb(plantPath, srcCb, externalBeforeResolveCb)
		
		return {
			get: function(config, cb){
				console.log('getting')
				if(typeof(config) === 'string'){
					config = {url: config}
				}
				
				if(config.cookie){
					var cookie = req.cookie(config.cookie)//'SID='+query.token+'|'+query.userId)
					j.add(cookie)
				}

				console.log('planting')
				
				var gFolder
				var overlayPlant = overlayPlantMaker.plant(function(generationFolder){
					var windowPath = generationFolder+'windowmodule.js'
					gFolder = generationFolder
					fs.writeFileSync(windowPath, 'exports.document = {}')
					var windowModule = require(windowPath)
					windowModule.document.addEventListener = function(){
					}
					windowModule.addEventListener = function(){
					}
					windowModule.document.createElement = function(){
					}
					windowModule.document.location = {
						href: config.url
					}
					windowModule.document.cookie = config.cookie
					windowModule.document.body = {
						addEventListener: function(){
						}
					}
					windowModule.document.querySelectorAll = function(){
						return []
					}
					var htmlObj = {
						addEventListener: function(){
						},
						style: ''
					}
					var bodyObj = {
						addEventListener: function(){
						},
						style: ''
					}
					windowModule.document.querySelector = function(selector){
						if(selector === 'html') return htmlObj
						if(selector === 'body') return bodyObj
						return []
					}
					windowModule.getSelection = function(){
						return {rangeCount: 0}
					}
					windowModule.document.getElementById = function(){
						return {
							addEventListener: function(){
							}
						}
					}
				})
				
				console.log('done planting')

				var cdl = _.latch(dynamicsToCache.length, function(){

					console.log('dynamics loaded: ' + dynamicsToCache.length)
					
					req.get({url: config.url, followRedirect: false, jar: j}, function(err, res, body){
						if(err){
							cb(err)
							return
						}
					
						if(res.statusCode < 200 || res.statusCode > 299){
							//console.log('status: ' + res.statusCode)
							cb('wrong status: ' + res.statusCode + ' ' + res.headers.location)//url)
							return
						}
					
						var si = body.indexOf(ParamsStartStr)
						if(si === -1){
							cb('no "page.params = {" found')
							return
						}
						si += ParamsStartStr.length-1
						var ei = body.indexOf('</script>', si)
						if(ei === -1){
							cb({msg: 'cannot find end of params script tag'})
							return
						}
					
						var paramsStr = body.substring(si, ei)
						//paramsStr = paramsStr.replace(/\r', '')
						paramsStr = paramsStr.replace(/\n/g, '')

						//console.log("Got params: " + paramsStr)//JSON.stringify(params));
					
						var params = JSON.parse(paramsStr)
				
						console.log('running plant with context')
						var plant = overlayPlant.run(params)
						cb(undefined, plant)
					})
				})
				
				var dynamicRequestCache = {}
				
				dynamicsToCache.forEach(function(dtc){
					req.get({url: serverPath+'js/'+dtc.name, followRedirect: false, jar: j}, function(err, res, body){
						//_.errout('TODO: get ' + JSON.stringify(dtc) + ' ' + body)
						//_module_wrapper
						var shortName = dtc.name.substr(0, dtc.name.length-3)
						var newSrc = 'var window = {};var dynamic_' + shortName + ' = module.exports;\n'
						newSrc += 'dynamic_'+shortName+'._module_wrapper = module;\n'
						
						console.log('newSrc: ' + newSrc)
						
						newSrc += body
						fs.writeFileSync(gFolder+dtc.path, newSrc)
						cdl()
						//_.errout('TO
					})
				})

				
			}
		}
	}
	
	/*var dirname = pathModule.dirname(module.filename)
	console.log(module.filename + ' -> ' + dirname)
	return function(plantPath){
		if(typeof(plantPath) !== 'string') throw new Error('plantPath must be a string')
		return load(dirname, plantPath)
	}*/
}

