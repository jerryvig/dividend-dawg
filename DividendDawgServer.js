// Generated by CoffeeScript 1.6.3
(function() {
    var app,
        querystring = require('querystring'),
        http = require('http'),
        jsdom = require('jsdom'),
        url = require('url'),
        fs = require('fs'),
        port = 8080,
        post_data = {
            'post_order1': 'date',
            'post_order2': 'symbol',
            'preferred': 'on',
            'adr': 'on',
            'etf': 'on',
            'etn': 'on',
            'fund': 'on',
            'note': 'on'
        };

    app = http.createServer(function(req, res) {
        var pathname = url.parse(req.url, true).pathname;

        function serveHTMLPage(path) {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            return fs.readFile(path, {
                'encoding': 'utf8'
            }, function(err, data) {
                return res.end(data);
            });
        };

        function serveJSFile(path) {
            res.writeHead(200, {
                'Content-Type': 'application/javascript'
            });
            return fs.readFile(path, {
                'encoding': 'utf8'
            }, function(err, data) {
                return res.end(data);
            });
        };

        function serveCSSFile(path) {
            res.writeHead(200, {
                'Content-Type': 'text/css'
            });
            return fs.readFile(path, {
                'encoding': 'utf8'
            }, function(err, data) {
                return res.end(data);
            });
        };

        function parseHtml(responseText) {
            return jsdom.env(responseText, ['http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js'], function(errors, window) {
                var dividendYieldArray, returnObject;
                $ = window.$;
                dividendYieldArray = [];
                $('.yield').each(function() {
                    var dividendYield, yieldObject;
                    dividendYield = $(this).find('.table-yield').first().text().trim();
                    if (dividendYield === 'Unknown') {
                        dividendYield = '0';
                    }

                    yieldObject = {
                        tickerText: $(this).find('.table-sym').first().text().trim(),
                        companyName: $(this).find('.table-company').first().text().trim(),
                        dividendYield: dividendYield,
                        exDate: '',
                        payDate: '',
                        payout: '',
                        qualifiedDividend: ''
                    };

                    $(this).find('td').each(function(idx) {
                        if (idx === 3) {
                            return yieldObject.exDate = $(this).text().trim();
                        } else if (idx === 4) {
                            return yieldObject.payDate = $(this).text().trim();
                        } else if (idx === 5) {
                            return yieldObject.payout = $(this).text().trim();
                        } else if (idx === 6) {
                            return yieldObject.qualifiedDividend = $(this).text().trim();
                        }
                    });
                    return dividendYieldArray.push(yieldObject);
                });

                dividendYieldArray.sort(function(a, b) {
                    var aDiv, bDiv;
                    aDiv = parseFloat(a.dividendYield.replace('%', ''));
                    bDiv = parseFloat(b.dividendYield.replace('%', ''));
                    return bDiv - aDiv;
                });

                return res.end(JSON.stringify({
                    'yield_rows': dividendYieldArray
                }));
            });
        };

        function getDividendTable() {
            var xhr, query;
            query = url.parse(req.url, true).query;
            if (query.hasOwnProperty('start_date')) {
                post_data.ExDividendDate1 = query.start_date;
            }

            if (query.hasOwnProperty('end_date')) {
                post_data.ExDividendDate2 = query.end_date;
            }

            xhr = http.request({
                hostname: 'www.dividend.com',
                port: 80,
                path: '/ex-dividend-dates.php',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }, function(resp) {
                var responseText;

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                resp.setEncoding('utf8');
                resp.on('data', function (chunk) {
                    responseText += chunk;
                });

                resp.on('end', function(){
                    parseHtml(responseText);
                });
            });
            xhr.write(querystring.stringify(post_data));
            xhr.end();
        };

        console.log('request to "' + pathname + '"');

        switch (pathname) {
            case '/getDividendTable':
                return getDividendTable();
            case '/':
                return serveHTMLPage('index.html');
            case '/index.html':
                return serveHTMLPage('index.html');
            case '/ng.html':
                return serveHTMLPage('ng.html');
            case '/hb.html':
                return serveHTMLPage('hb.html');
            case '/ember.html':
                return serveHTMLPage('ember.html');
            case '/lib/ember-table.js':
                return serveJSFile('lib/ember-table.js');
            case '/lib/antiscroll.js':
                return serveJSFile('lib/antiscroll.js');
            case '/lib/ember-table.css':
                return serveCSSFile('lib/ember-table.css');
            default:
                res.writeHead(404);
                return res.end('404 NOT FOUND');
        }
    });

    app.listen(port);
    console.log("Server listening on port " + port);

}).call(this);