window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  showStudyList: true,
    customizationService: [
    '@ohif/extension-default.customizationModule.theme',
  ],

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'medic',
      configuration: {
        friendlyName: 'MEDIC DICOMweb',
        name: 'MEDIC',
        wadoUriRoot: 'http://127.0.0.1:8001/dicom-web',
qidoRoot: 'http://127.0.0.1:8001/dicom-web',
wadoRoot: 'http://127.0.0.1:8001/dicom-web',
        qidoSupportsIncludeField: true,
        supportsReject: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
  ],

  defaultDataSourceName: 'medic',
};
