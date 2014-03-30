# Requires go here.
querystring = require('querystring')
http = require('http')
jsdom = require('jsdom')
url = require('url')
fs = require('fs')
$ = require('jquery')
port = 8080

post_data = 
	'post_order1':'date',
	'post_order2':'symbol',
	'preferred':'on',
	'adr':'on',
	'etf':'on',
	'etn':'on',
	'fund':'on',
	'note':'on'

app = http.createServer (req, res) ->
	pathname = url.parse(req.url, true).pathname

	serveIndexPage = () ->
		res.writeHead(200, {'Content-Type': 'text/html'})
		fs.readFile 'index.html', {'encoding':'utf8'}, (err, data) -> res.end(data)

	parseHtml = (responseText) ->
		jsdom.env(
			responseText,
			['http://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js'],
			(errors, window) ->
				$ = window.$

				dividendYieldArray = []
				$('.yield').each () ->
					dividendYield = $(this).find('.table-yield').first().text().trim()
					if dividendYield is 'Unknown'
						dividendYield = '0'

					yieldObject = 
						tickerText: $(this).find('.table-sym').first().text().trim()
						companyName: $(this).find('.table-company').first().text().trim()
						dividendYield: dividendYield
						exDate: ''
						payDate: ''
						payout: ''
						qualifiedDividend: ''

					$(this).find('td').each (idx) ->
						if (idx is 3) 
							yieldObject.exDate = $(this).text().trim()
						else if (idx is 4)
							yieldObject.payDate = $(this).text().trim()
						else if (idx is 5) 
							yieldObject.payout = $(this).text().trim()
						else if (idx is 6)
							yieldObject.qualifiedDividend = $(this).text().trim()

					dividendYieldArray.push( yieldObject )

				dividendYieldArray.sort (a,b) ->
					aDiv = a.dividendYield.replace('%','')*1.0
					bDiv = b.dividendYield.replace('%','')*1.0
					return (bDiv-aDiv)

				returnObject = 
					'yield_rows':dividendYieldArray

				res.end JSON.stringify returnObject
		)

	getDividendTable = () ->
		query = url.parse(req.url, true).query

		if query.hasOwnProperty('start_date')
			post_data.ExDividendDate1 = query.start_date
		if query.hasOwnProperty('end_date')
			post_data.ExDividendDate2 = query.end_date

		jqxhr = $.post 'http://www.dividend.com/ex-dividend-dates.php', querystring.stringify(post_data),(responseText) ->
			res.writeHead(200, {'Content-Type': 'application/json'})
			console.log('PARSING THE HTML')

			parseHtml responseText
		, 'html'

		jqxhr.fail () -> 
			console.log 'FAILED TO RETRIEVE THE DATA'
	switch pathname
		when '/getDividendTable'
			getDividendTable()
		when '/'
			serveIndexPage()		
		when '/index.html'
			serveIndexPage()
		else
			res.writeHead 404
			res.end '404 NOT FOUND'

app.listen(port)
console.log "Server listening on port #{port}"
