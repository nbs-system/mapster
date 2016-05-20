var _ = require('lodash');
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';

var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope, Private) {
  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);

  $scope.$watch('esResponse', function (resp) {
    if (resp) {
      const vis = $scope.vis;
      const params = vis.params;

      var table = tabifyAggResponse(vis, resp, {
        partialRows: params.showPatialRows,
        minimalColumns: vis.isHierarchical() && !params.showMeticsAtAllLevels,
        asAggConfigResults: true
      });

      var table = table.tables[0];

      if (table == undefined) {
        $scope.data = null;
        return;
      }

      console.log(table);

      $scope.data = table.rows.map(function(row) {
        return {
          timestamp: row[0].key,
          coords: row[1].key,
          peer_ip: row[2].key,
          sensor: row[3].key,
          count: row[4].key
        };
      });
    }

  });
});

