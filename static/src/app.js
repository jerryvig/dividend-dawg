(function(window) {
    'use strict';
    var COLUMN_WIDTH = 160,
        NUM_ROWS = 100;

    window.DividendDawg = Ember.Application.create();

    DividendDawg.ApplicationController = Ember.Controller.extend({
        startDate: (new Date()).toISOString().substr(0, 10),
        endDate: (new Date()).toISOString().substr(0, 10),

        numRows: NUM_ROWS,

        columns: Ember.computed(function() {
            var tickerColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                textAlign: 'text-align-left',
                headerCellName: 'Ticker',
                getCellContent: function(row) {
                    return row.tickerText;
                }
            });

            var nameColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                headerCellName: 'Company Name',
                getCellContent: function(row) {
                    return row.companyName;
                }
            });

            var exDateColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                headerCellName: 'Ex Date',
                getCellContent: function(row) {
                    return row.exDate;
                }
            });

            var payDateColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                headerCellName: 'Pay Date',
                getCellContent: function(row) {
                    return row.payDate;
                }
            });

            var payoutColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                headerCellName: 'Payout',
                getCellContent: function(row) {
                    return row.payout;
                }
            });

            var yieldColumn = Ember.Table.ColumnDefinition.create({
                columnWidth: COLUMN_WIDTH,
                headerCellName: 'Yield',
                getCellContent: function(row) {
                    return row.dividendYield;
                }
            });

            return [tickerColumn, nameColumn, exDateColumn, payDateColumn, payoutColumn, yieldColumn];
        }),

        content: Ember.ArrayProxy.create({
            content: new Array(NUM_ROWS),
            init: function() {
                var self = this;
                Ember.$.getJSON('/getDividendTable', function(json){
                    self.set('content', json.yield_rows);
                }).fail(function() {
                    alert('HTTP REQUEST FAILED.');
                });
            }
        })
    });
})(window);