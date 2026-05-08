import Toybox.Application;
import Toybox.Lang;
import Toybox.WatchUi;

// Entry point for the weWatch license-demo watch face.
// Flow:
//   1. App starts → view shows STATE_LOADING
//   2. onStart() fires the activate() HTTP call
//   3. HTTP callback receives { activated, licenseKey } or error
//   4. View transitions to UNLOCKED / LOCKED / ERROR
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
            // 2xx = activation accepted by server
            view.setState(STATE_UNLOCKED);
        } else if (responseCode == 402 || responseCode == 403) {
            view.setState(STATE_LOCKED);
        } else {
            view.setState(STATE_ERROR);
        }
    }

    function onCheckResponse(responseCode as Number, data as Lang.Object?) as Void {
        var view = _view;
        if (view == null) { return; }

        if (responseCode == 200 && data instanceof Lang.Dictionary) {
            var valid = (data as Lang.Dictionary)["valid"];
            view.setState((valid != null && valid == true) ? STATE_UNLOCKED : STATE_LOCKED);
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
