var _ = require('lodash');
var geohash = require('plugins/mapster/lib/latlon-geohash.js');

import { AggResponseTabifyTabifyProvider } from 'ui/agg_response/tabify/tabify';

var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope, Private) {
  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);
  const palette = ['#DC143C', '#FFD700', '#228B22', '#20B2AA', '#FF00FF', '#D2691E', '#FA8072', '#006400', '#0000CD', '#9400D3', '#A0522D', '#00BFFF', '#3CB371', '#7CFC00', '#8B0000', '#EEE8AA', '#00FF7F','#87CEFA', '#FF69B4', '#B0C4DE'];

  $scope.$watch('esResponse', function (resp) {
    if (resp) {
      const vis = $scope.vis;
      const params = vis.params;

      // Get the column numbers
      try {
        var timestampAggId = vis.aggs.bySchemaName['timestamp'][0].id;
        var coordsAggId = vis.aggs.bySchemaName['coords'][0].id;
        var peerIpAggId = vis.aggs.bySchemaName['peer_ip'][0].id;
        var sensorAggId = vis.aggs.bySchemaName['sensor'][0].id;
      } catch (err) {
        console.error("One of the required agregations is not set.");
      }

      var targetAggId;
      try {
        targetAggId = vis.aggs.bySchemaName['target'][0].id;
      } catch (err) {
        console.log("Target location is not set.");
      }

      var timestampColumn = -1;
      var coordsColumn = -1;
      var peerIpColumn = -1;
      var sensorColumn = -1;
      var targetColumn = -1;

      // Tabify response
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

      for (var i = 0; i < table.columns.length; i++) {
        var id = table.columns[i].aggConfig.id;
        switch (id) {
          case timestampAggId:
            timestampColumn = i;
            break;
          case coordsAggId:
            coordsColumn = i;
            break;
          case peerIpAggId:
            peerIpColumn = i;
            break;
          case sensorAggId:
            sensorColumn = i;
            break;
          case targetAggId:
            targetColumn = i;
            break;
        }
      }

      var colors = {};

      $scope.data = table.rows.map(function(row) {
        var sensor = row[sensorColumn].key;
        // Fill the colors array
        if (colors[sensor] === undefined) {
          colors[sensor] = 0;
        } else {
          colors[sensor] += 1;
        }

        // Return data rows
        // TODO Add extra information from extra buckets
        // FIXME Maybe extra buckets are useless actually.
        var data = {};
        data['timestamp'] = row[timestampColumn].key;
        data['coords'] = geohash.decode(row[coordsColumn].key);
        data['peer_ip'] = row[peerIpColumn].key;
        data['sensor'] = sensor;
        data['count'] = row[4].key;
        if (targetColumn >= 0) {
          data['target'] = geohash.decode(row[targetColumn].key);
        }

        return data;
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
