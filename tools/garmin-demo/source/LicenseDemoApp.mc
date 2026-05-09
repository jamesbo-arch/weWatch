import Toybox.Application;
import Toybox.Background;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;
import Toybox.WatchUi;

// Entry point for the weWatch container watchface.
// Flow:
//   1. onStart() registers a background temporal event
//   2. LicenseServiceDelegate.onTemporalEvent() calls activate API in background
//   3. Background.exit(data) triggers onBackgroundData() here
//   4. onBackgroundData() pushes renderSpec to the WatchFace view
//   5. On subsequent launches, getInitialView() loads cached spec from Storage
class LicenseDemoApp extends Application.AppBase {

    private var _view as LicenseDemoView?;

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary?) as Void {
        Background.registerForTemporalEvent(new Time.Duration(5 * 60));
    }

    function getServiceDelegate() as [System.ServiceDelegate] {
        return [new $.LicenseServiceDelegate()];
    }

    function onBackgroundData(data as Application.PersistableType) as Void {
        var view = _view;
        if (!(data instanceof Lang.Dictionary)) {
            if (view != null) { view.setState(STATE_ERROR); }
            return;
        }
        var spec = (data as Lang.Dictionary)["renderSpec"];
        if (!(spec instanceof Lang.Dictionary)) {
            if (view != null) { view.setState(STATE_ERROR); }
            return;
        }
        if (view == null) { return; }
        view.setRenderSpec(spec as Lang.Dictionary);
        view.setState(STATE_UNLOCKED);
    }

    function getInitialView() as [WatchUi.Views] or [WatchUi.Views, WatchUi.InputDelegates] {
        var view = new LicenseDemoView();
        _view = view;
        var spec = Application.Storage.getValue("renderSpec") as Lang.Dictionary?;
        if (spec != null) {
            view.setRenderSpec(spec);
            view.setState(STATE_UNLOCKED);
        }
        return [view];
    }

    function onStop(state as Lang.Dictionary?) as Void {
    }
}

function getApp() as LicenseDemoApp {
    return Application.getApp() as LicenseDemoApp;
}
