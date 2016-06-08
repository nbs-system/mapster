var _ = require('lodash');
var geohash = require('plugins/mapster/lib/latlon-geohash.js');

import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';

var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope, Private) {
  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
  const palette = ['#DC143C', '#FFD700', '#228B22', '#20B2AA', '#FF00FF', '#D2691E', '#FA8072', '#006400', '#0000CD', '#9400D3', '#A0522D', '#00BFFF', '#3CB371', '#7CFC00', '#8B0000', '#EEE8AA', '#00FF7F','#87CEFA', '#FF69B4', '#B0C4DE'];

  $scope.$watch('esResponse', function (resp) {
    if (resp) {
      const vis = $scope.vis;
      const params = vis.params;

      var table = tabifyAggResponse(vis, resp, {
        partialRows: params.showPatialRows,
        minimalColumns: vis.isHierarchical() && !params.showMeticsAtAllLevels,
        asAggConfigResults: true
      });

      table = table.tables[0];

      if (table === undefined) {
        $scope.data = null;
        return;
      }

      var colors = {};

      // Get the sensor column
      var sensorAggId = $scope.vis.aggs.bySchemaName['sensor'][0].id;
      var sensorColumn = 0;
      for (var i = 0; i < table.columns.length; i++) {
        if (table.columns[i].aggConfig.id === sensorAggId) {
          sensorColumn = i;
          break;
        }
      }

      $scope.data = table.rows.map(function(row) {
        var sensor = row[sensorColumn].key;
        // Fill the colors array
        if (colors[sensor] === undefined) {
          colors[sensor] = 0;
        } else {
          colors[sensor] += 1;
        }

        // Return data rows
        // TODO The rows order might not be respected, check sensor column above
        return {
          timestamp: row[0].key,
          coords: geohash.decode(row[1].key),
          peer_ip: row[2].key,
          sensor: sensor, 
          count: row[4].key
        };
      });

      // We sort it so the most used sensors have always the same color
      var sorted = [];
      for (var c in colors) {
        sorted.push([c, colors[c]]);
      }
      sorted.sort(function(a, b) { return b[1] - a[1]; });

      // Attribute colors
      for (i = 0; i < sorted.length; i++) {
        colors[sorted[i][0]] = {name: sorted[i][0], color: palette[i]};
      }
      $scope.colors = colors;

    }

  });
});

