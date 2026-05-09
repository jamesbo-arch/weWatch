import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

// Entry point for the weWatch container watch app.
// Flow:
//   1. onStart() fires the activate() HTTP call
//   2. HTTP callback receives { activated, licenseKey, renderSpec } or error
//   3. View renders from spec (UNLOCKED) or shows LOCKED / ERROR state
class LicenseDemoApp extends Application.AppBase {

    private var _view as LicenseDemoView?;
    private var _checker as LicenseChecker?;

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary?) as Void {
        _checker = new LicenseChecker();
        _checker.activate(method(:onActivateResponse));
    }

    function onActivateResponse(responseCode as Number, data as Lang.Object?) as Void {
        var view = _view;
        if (view == null) { return; }

        if (responseCode == 200 || responseCode == 201) {
            if (data instanceof Lang.Dictionary) {
                var dict = data as Lang.Dictionary;
                var spec = dict["renderSpec"];
                if (spec instanceof Lang.Dictionary) {
                    view.setRenderSpec(spec as Lang.Dictionary);
                }
            }
            view.setState(STATE_UNLOCKED);
        } else if (responseCode == 402 || responseCode == 403) {
            view.setState(STATE_LOCKED);
        } else {
            view.setState(STATE_ERROR);
        }
    }

    function getInitialView() as [WatchUi.Views] or [WatchUi.Views, WatchUi.InputDelegates] {
        var view = new LicenseDemoView();
        _view = view;
        return [view];
    }

    function onStop(state as Lang.Dictionary?) as Void {
    }
}

function getApp() as LicenseDemoApp {
    return Application.getApp() as LicenseDemoApp;
}
