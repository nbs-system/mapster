var module = require("ui/modules").get("mapster");

module.directive("mapster", function (es, $timeout) {

  function link($scope, $element) {

    /* (re)load the configuration */
    function loadConfig() {
      return {
        /* Global */
        "globe": $scope.vis.params.globe,
        "multipleTargets": $scope.vis.params.multipleTargets,
        "TargetCoords": JSON.parse($scope.vis.params.TargetCoords),
        /* Map */
        "OriginDefaultSize": parseInt($scope.vis.params.OriginDefaultSize),
        "OriginMaximumSize": parseInt($scope.vis.params.OriginMaximumSize),
        "OriginDyingTime": parseInt($scope.vis.params.OriginDyingTime),
        "ObjectShape": $scope.vis.params.ObjectShape,
        "ObjectScale": parseFloat($scope.vis.params.ObjectScale),
        "ObjectRotation": parseInt($scope.vis.params.ObjectRotation),
        "SpecialEffects": $scope.vis.params.SpecialEffects,
        "SpecialEffectsScale": parseFloat($scope.vis.params.SpecialEffectsScale),
        "SpecialShape": $scope.vis.params.SpecialShape,
        "SpecialShapeScale": parseFloat($scope.vis.params.SpecialShapeScale),
        "SpecialShapeRemaining": parseInt($scope.vis.params.SpecialShapeRemaining),
        "HideUnlocated": $scope.vis.params.HideUnlocated,
        "EnableExplosion": $scope.vis.params.EnableExplosion,
        "ExplosionFile": $scope.vis.params.ExplosionFile,
        "ExplosionHeight": parseInt($scope.vis.params.ExplosionHeight),
        "ExplosionWidth": parseInt($scope.vis.params.ExplosionWidth),
        "ExplosionDelay": parseInt($scope.vis.params.ExplosionDelay),
        "maximumEvents": parseInt($scope.vis.params.maximumEvents)
      };
    }

    var config = loadConfig();
    var renderer;

    $scope.open = $scope.open || true;

    $scope.toggleLegend = function () {
      $scope.open = !$scope.open;
    };

    //TODO Refactor this please it's so ugly
    if (config.globe === true) {
      renderer = require("plugins/mapster/lib/globe.js");
      renderer.setConfig(config, $timeout);

      /* Render events each time kibana fetches new data */
      $scope.$watch("data", function () {
        renderer.renderEvents($scope.data, $scope.colors);
      });

      /* Redraw everything when options are modified */
      $scope.$watch("vis.params", function () {
        config = loadConfig();
        renderer.setConfig(config, $timeout);
      });

      // First map render is a bit postponed otherwise it does not work
      $timeout(function () {
        renderer.init($element);
        renderer.render();
      }, 100);
    } else {
      renderer = require("plugins/mapster/lib/map.js");
      renderer.setConfig(config, $timeout);

      /* Render events each time kibana fetches new data */
      $scope.$watch("data", function () {
        renderer.renderEvents($scope.data, $scope.colors);
      });

      /* Redraw everything when options are modified */
      $scope.$watch("vis.params", function () {
        config = loadConfig();
        renderer.setConfig(config, $timeout);
      });

      // First map render is a bit postponed otherwise it does not work
      $timeout(function () {
        renderer.renderMap($element);
      }, 100);
    }

  }

  return {
    restrict: "E",
    link: link
  };
});

