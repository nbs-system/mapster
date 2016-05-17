require('plugins/mapster/mapster.less');
require('plugins/mapster/lib/mapster_directive.js');

function mapsterProvider(Private) {
  var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));

  return new TemplateVisType({
    name: 'mapster',
    title: 'Mapster',
    description: 'Displays a map of shaded regions using a field containing a 2 letter country ' +
      ', or US state, code. Regions with more hits are shaded darker. Note that this does use the' +
      ' Elasticsearch terms aggregation, so it is important that you set it to the correct field.',
    icon: 'fa-globe',
    template: require('plugins/mapster/mapster.html')
  });
}

require('ui/registry/vis_types').register(mapsterProvider);

