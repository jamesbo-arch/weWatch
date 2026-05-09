import Toybox.Application;
import Toybox.Background;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;

(:background)
class LicenseServiceDelegate extends System.ServiceDelegate {

    function initialize() {
        ServiceDelegate.initialize();
    }

    function onTemporalEvent() as Void {
        Background.registerForTemporalEvent(new Time.Duration(15 * 60));
        var checker = new LicenseChecker();
        checker.activate(method(:onActivateResponse));
    }

    function onActivateResponse(responseCode as Number, data as Lang.Object?) as Void {
        if (responseCode == 200 || responseCode == 201) {
            if (data instanceof Lang.Dictionary) {
                var spec = (data as Lang.Dictionary)["renderSpec"];
                if (spec instanceof Lang.Dictionary) {
                    Application.Storage.setValue("renderSpec", spec);
                }
            }
        }
        Background.exit(data);
    }
}
