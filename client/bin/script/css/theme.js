function getThemeFileManager(less) {
  class ThemeFileManager extends less.FileManager {
    constructor(options) {
      super(options);
      this.options = options;
    }
    loadFile(filename, currentDirectory, options, environment) {
      if (/^(\.\/)?theme\/(\w+)?(black|white)(\.less)?$/.test(filename)) {
        filename = filename.replace(/(black|white)(\.less)?$/, this.options.theme + '.less');
      } else if (!filename.endsWith('.less')) {
        filename += '.less';
      }
      if (!currentDirectory) {
        currentDirectory = this.options.indexDir;
      }
      return super.loadFile(filename, currentDirectory, options, environment);
    }
  }
  return ThemeFileManager;
}

class LessPluginTheme {
  constructor(options) {
    this.setOptions(options);
  }
  install(less, pluginManager) {
    const ImportFileManager = getThemeFileManager(less);
    pluginManager.addFileManager(new ImportFileManager(this.options));
  }
  setOptions(options) {
    this.options = this.parseOptions(options);
  }
  parseOptions(options) {
    return options;
  }
}

module.exports = LessPluginTheme;