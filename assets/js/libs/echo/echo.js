define(['./echo-8.0.0'], function (Echo) {

    var echoInstance;
    var settings;

    var initEcho = function (config) {
        settings = config;
        if (Echo) {

            if (settings.isDev) {
                Echo.Debug.enable();
            }

            var Media = Echo.Media,
                EchoClient = Echo.EchoClient,
                Enums = Echo.Enums,
                ConfigKeys = Echo.ConfigKeys,
                Environment = Echo.Environment;

            var conf = {};
            if (settings.isDev) {
                conf[ConfigKeys.ECHO_TRACE] = settings.echoCounterName + 'Dev-' + Math.random();
                conf[ConfigKeys.TEST_SERVICE_ENABLED] = true;
                conf[ConfigKeys.TEST_SERVICE_URL] = 'http://echo-chamber.api.bbci.co.uk';
            }

            // store this globally
            echoInstance = new EchoClient(
                settings.appName,
                Enums.ApplicationType.WEB,
                conf
            );

            var appVersion = '1.0.0';
            echoInstance.setAppVersion(appVersion);
            var labels = {
                version: appVersion,
                environment: settings.environment
            };

            // default to taster site
            echoInstance.addManagedLabel(Enums.ManagedLabels.BBC_SITE, "taster");
            echoInstance.viewEvent("taster.pilot." + settings.echoCounterName + ".internal.page", labels);
        }
    };

    // send data to echo
    var trackUserAction = function(actionType, actionName) {
        if (Echo && echoInstance) {
            if (settings.isDev) {
                console.log('Tracking user action: type=' + actionType + ', name=' + actionName);
            }
            // eg 'click', 'specialButtonA'
            echoInstance.userActionEvent(actionType, actionName);
        }
    };

    window._ECHOJS = {
        init: initEcho,
        track: trackUserAction
    };
});
