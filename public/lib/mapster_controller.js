var _ = require('lodash');

var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope) {
  $scope.$watch('esResponse', function (resp) {
    if (!resp) {
      $scope.data = null;
      return;
    }

    var timestampAggId = $scope.vis.aggs.bySchemaName['timestamp'][0].id;
    var srcCoordsAggId = $scope.vis.aggs.bySchemaName['src_coords'][0].id;
    var buckets = resp.aggregations[timestampAggId] && resp.aggregations[timestampAggId].buckets;

    $scope.data = buckets.map(function(bucket) {
      return {
        timestamp: bucket.key,
        coords: bucket //TODO Make it bun dem !
      };
    });
  });
});

