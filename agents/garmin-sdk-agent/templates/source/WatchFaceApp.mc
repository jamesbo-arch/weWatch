// weWatch Watch Face · 应用入口
// 此文件几乎不变；生成器仅按需调整 import 与 entry 类名。
//
// Codegen contract:
// - 入口类名固定为 WeWatchApp（与 manifest.xml entry 字段一致）
// - 不在此文件中放任何业务逻辑

import Toybox.Application;
import Toybox.WatchUi;
import Toybox.Lang;

class WeWatchApp extends Application.AppBase {

    function initialize() {
        AppBase.initialize();
    }

    function onStart(state as Lang.Dictionary?) as Void {}

    function onStop(state as Lang.Dictionary?) as Void {}

    function getInitialView() as Lang.Array<WatchUi.Views or WatchUi.InputDelegates>? {
        return [ new WeWatchView() ] as Lang.Array<WatchUi.Views or WatchUi.InputDelegates>;
    }

    function onSettingsChanged() as Void {
        WatchUi.requestUpdate();
    }
}

function getApp() as WeWatchApp {
    return Application.getApp() as WeWatchApp;
}
