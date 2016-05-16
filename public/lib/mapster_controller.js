var module = require('ui/modules').get('mapster');

module.controller('MapsterController', function ($scope) {

  /*$scope.$watch('esResponse', function (resp) {
    if (!resp || !resp.aggregations) {
      $scope.data = {};
      return;
    }

    var srcCountryAggId = $scope.vis.aggs.bySchemaName['src_country'][0].id;
    var metricsAgg = $scope.vis.aggs.bySchemaName['metric'][0];

    var buckets = resp.aggregations[srcCountryAggId] && resp.aggregations[srcCountryAggId].buckets;

    $scope.data = {};
    
    buckets.forEach(function (bucket) {
        $scope.data[bucket.key.toUpperCase()] = metricsAgg.getValue(bucket);
    });
  });*/
});

