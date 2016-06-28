var module = require('ui/modules').get('mapster');

module.controller('MapsterParamsEditor', function MapsterParamsEditor($scope) {
  $scope.params = [
    {
      param: 'globe',
      title: 'Use a 3D map',
      help: 'Two maps are available. You can select a 2D world map or a 3D globe. Values true: use a 3D globe false: use a 2D world map',
      type: 'checkbox'
    },
    {
      param: 'ObjectShape',
      title: 'Object shape',
      help: 'This is an svg path as "M150 0 L75 200 L225 200 Z" without quotes. Type string',
      type: 'text'
    },
    {
      param: 'ObjectScale',
      title: 'Object scale',
      help: 'The scale of your svg path. Depends on the option above. Type float',
      type: 'text'
    },
    {
      param: 'ObjectRotation',
      title: 'Object rotation',
      help: 'This is the rotation of your object. If the default path is looking at the top, then the value is 90. ',
      type: 'text'
    },
    {
      param: 'multipleTargets',
      title: 'Multiple targets',
      help: 'If the attacks should point to different targets, then select this. If you uncheck it, then the targets will point to the same unique location. Values  true: use multiple directions false: use only one direction',
      type: 'checkbox'
    },
    {
      param: 'TargetCoords',
      title: 'Target coordinates',
      help: 'If the above option is false (only one target) then the format is like so: [lat, lon]. Otherwise you have to specify multiple locations like this: {"loc1", [lat, lon], "loc2", [lat, lon]}',
      type: 'text'
    },
    {
      param: 'SpecialShape',
      title: 'Special shape',
      help: 'The svg path marking special events on the map. Type string',
      type: 'text'
    },
    {
      param: 'SpecialEffects',
      title: 'Special events',
      help: 'The name of the special events. List as ["name", "name2"]. Type list',
      type: 'text'
    },
    {
      param: 'SpecialEffectsScale',
      title: 'Special shape scale',
      help: 'The scale of your sepcial shape. Type float',
      type: 'text'
    },
    {
      param: 'SpecialShapeRemaining',
      title: 'Special shape remaining',
      help: 'The time the special shape marking a special events stays on the map in ms. Type integer',
      type: 'text'
    },
    {
      param: 'OriginDefaultSize',
      title: 'Default size of origins',
      help: 'Events have a small circle near their origin. This is their default size. Type integer',
      type: 'text'
    },
    {
      param: 'OriginMaximumSize',
      title: 'Maximum size of origins',
      help: 'The maximum size the circle near an event origin can have. Type float',
      type: 'text'
    },
    {
      param: 'OriginDyingTime',
      title: 'Origin dying time',
      help: 'The time the origin dies in seconds. Type integer',
      type: 'text'
    },
    {
      param: 'HideUnlocated',
      title: 'Hide unlocated events',
      help: 'If you have unlocated events (0,0) and you want to hide from the map, check this box. Values true: hide events false: show events',
      type: 'checkbox'
    },
    {
      param: 'EnableExplosion',
      title: 'Enable explosions',
      help: 'If you want to enable explosions for special events. Values true: show explosions false: hide explosions',
      type: 'checkbox'
    },
    {
      param: 'ExplosionFile',
      title: 'Explosion file',
      help: 'Explosions are shown with a gif file. This is the path to the gif file. The file must be inside the public/img/ folder. Type string',
      type: 'text'
    },
    {
      param: 'ExplosionHeight',
      title: 'Explosion height',
      help: 'Set the gif height. Type integer',
      type: 'text'
    },
    {
      param: 'ExplosionWidth',
      title: 'Explosion width',
      help: 'Set the gif width. Type integer',
      type: 'text'
    },
    {
      param: 'ExplosionDelay',
      title: 'Explosion duration',
      help: 'The duration of the gif animation in ms. Type integer',
      type: 'text'
    },
    {
      param: 'maximumEvents',
      title: 'Log table event nb',
      help: 'The number of events you want to show in the log table. Type integer',
      type: 'text'
    }
  ];

  $scope.showhelp = {};

});

