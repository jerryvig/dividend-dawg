var querystring = require('querystring'),
	http = require('http'),
	jsdom = require('jsdom'),
	url = require('url'),
	fs = require('fs'),
	$ = require('jquery');

var post_data = {
	'post_order1':'date',
	'post_order2':'symbol',
	'preferred':'on',
	'adr':'on',
	'etf':'on',
	'etn':'on',
	'fund':'on',
	'note':'on'
};

/**
 * The HTTP server is setup here.
 */
http.createServer(function(req,res){	
	var pathname = url.parse(req.url, true).pathname;

	if (pathname == '/getDividendTable'){
		var query = url.parse(req.url, true).query;

		if (query.hasOwnProperty('start_date')){
			post_data.ExDividendDate1 = query.start_date;
		}
		if (query.hasOwnProperty('end_date')){
			post_data.ExDividendDate2 = query.end_date;
		}

		$.post('http://www.dividend.com/ex-dividend-dates.php', querystring.stringify(post_data), function(responseText){
			res.writeHead(200, {'Content-Type': 'application/json'});
			console.log('PARSING THE HTML');

			parseHtml(responseText, res);
		}, 'html').fail(function(){
			console.log('FAILED TO RETRIEVE THE DATA');
		});
	} else if (pathname == '/' || pathname == '/index.html') {
		res.writeHead(200, {'Content-Type': 'text/html'});
		fs.readFile('index.html', {'encoding':'utf8'}, function(err, data){
			res.end(data);
		});
	} else {
		res.writeHead(404);
		res.end('404 NOT FOUND');
	}
}).listen(8080);

/**
 * HTML Parser here.
 */
function parseHtml(responseText, res){
	jsdom.env(
		responseText,
		['http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'],
		function(errors, window){
			var $ = window.$;

			var dividendYieldArray = new Array();
			$('.yield').each(function(){
				var yieldObject = new Object();
				yieldObject.tickerText = $(this).find('.table-sym').first().text().trim();
				yieldObject.companyName = $(this).find('.table-company').first().text().trim();
				yieldObject.dividendYield = $(this).find('.table-yield').first().text().trim();
				yieldObject.dividendYield = (yieldObject.dividendYield == 'Unknown') ? '0.0' : yieldObject.dividendYield;
				yieldObject.exDate = '';
				yieldObject.payDate = '';
				yieldObject.payout = '';
				yieldObject.qualifiedDividend = '';

				$(this).find('td').each(function(idx){
					if (idx ===  3) {
						yieldObject.exDate = $(this).text().trim();
					} else if (idx === 4) {
						yieldObject.payDate = $(this).text().trim();
					} else if (idx === 5) {
						yieldObject.payout = $(this).text().trim();
					} else if (idx === 6) {
						yieldObject.qualifiedDividend = $(this).text().trim();
					}
				});
				dividendYieldArray.push( yieldObject );
			});

			dividendYieldArray.sort(function(a,b){
				var aDiv = a.dividendYield.replace('%','')*1.0;
				var bDiv = b.dividendYield.replace('%','')*1.0;
				return (bDiv-aDiv);
			});

			res.end(JSON.stringify({'yield_rows':dividendYieldArray}));
		}
	);
}

/**
 *  Takes the an array of yieldObjects produced by parseHtml and sorts them by the dividend yield.
 */
