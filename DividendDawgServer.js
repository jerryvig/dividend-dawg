(function() {
    'use strict';
    var app,
        express = require('express'),
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

        function parseHtml(responseText, res) {
            return jsdom.env(responseText, ['http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js'], function(errors, window) {
                var dividendYieldArray, returnObject;
                var $ = window.$;
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
        }

        function getDividendTable(req, res) {
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
                    parseHtml(responseText, res);
                });
            });
            xhr.write(querystring.stringify(post_data));
            xhr.end();
        }

    app = express();

    app.get('/getDividendTable', function(req, res){
        getDividendTable(req, res);
    });

    app.use(express.static(__dirname + '/static'));
    app.listen(port);
    console.log("Express started and listening on port " + port);
}).call(this);