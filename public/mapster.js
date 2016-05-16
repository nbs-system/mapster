require('plugins/mapster/mapster.less');
//require('plugins/mapster/lib/mapster_controller.js');
require('plugins/mapster/lib/mapster_directive.js');

function mapsterProvider(Private) {
  var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
  //var Schemas = Private(require('ui/Vis/Schemas'));

  return new TemplateVisType({
    name: 'mapster',
    title: 'Mapster',
    description: 'Displays a map of shaded regions using a field containing a 2 letter country ' +
      ', or US state, code. Regions with more hits are shaded darker. Note that this does use the' +
      ' Elasticsearch terms aggregation, so it is important that you set it to the correct field.',
    icon: 'fa-globe',
    template: require('plugins/mapster/mapster.html')//,
    /*params: {
      defaults: {
        minColor: '#A0E2E2',
        maxColor: '#265656',
        tipNumberFormat: 'number'
      },
      editor: require('plugins/mapster/mapster_vis_params.html')
    },
    /*schemas: new Schemas([
      {
        group: 'metrics',
        name: 'metric',
        title: 'Metric',
        min: 1,
        max: 1,
        aggFilter: ['avg', 'sum', 'count', 'min', 'max', 'median', 'cardinality'],
        defaults: [
          { schema: 'metric', type: 'count' }
        ]
      },
      {
        group: 'buckets',
        name: 'src_country',
        icon: 'fa fa-flag',
        title: 'Source country',
        min: 1,
        max: 1,
        aggFilter: ['terms', 'significant_terms']
      }
    ]),
    requiresSearch: true*/
  });
}

require('ui/registry/vis_types').register(mapsterProvider);

