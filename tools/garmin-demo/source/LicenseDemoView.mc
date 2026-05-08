import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.WatchUi;

// Possible license states for the demo watch face
enum LicenseState {
    STATE_LOADING,
    STATE_UNLOCKED,
    STATE_LOCKED,
    STATE_ERROR
}

// Renders the watch face with three visual modes:
//   LOADING  → grey spinner text while the HTTP request is in flight
//   UNLOCKED → full watch face with time + device serial (green accent)
//   LOCKED   → blocked face with "LOCKED" overlay (red accent)
//   ERROR    → network error indicator
class LicenseDemoView extends WatchUi.View {

    private var _state as LicenseState = STATE_LOADING;
    private var _deviceSerial as String = "";

    function initialize() {
        View.initialize();
        _deviceSerial = (new LicenseChecker()).getDeviceSerial();
    }

    function onLayout(dc as Graphics.Dc) as Void {
    }

    function setState(state as LicenseState) as Void {
        _state = state;
        WatchUi.requestUpdate();
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var w = dc.getWidth();
        var h = dc.getHeight();
        var cx = w / 2;
        var cy = h / 2;

        dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
        dc.clear();

        if (_state == STATE_LOADING) {
            drawLoading(dc, cx, cy);
        } else if (_state == STATE_UNLOCKED) {
            drawUnlocked(dc, cx, cy, w, h);
        } else if (_state == STATE_LOCKED) {
            drawLocked(dc, cx, cy);
        } else {
            drawError(dc, cx, cy);
        }
    }

    private function drawLoading(dc as Graphics.Dc, cx as Number, cy as Number) as Void {
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy - 20, Graphics.FONT_MEDIUM, "weWatch", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy + 10, Graphics.FONT_SMALL, "Checking license...", Graphics.TEXT_JUSTIFY_CENTER);
    }

    private function drawUnlocked(dc as Graphics.Dc, cx as Number, cy as Number, w as Number, h as Number) as Void {
        // Background ring — green tint to signal licensed state
        dc.setColor(0x00AA44, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(cx, cy, cx - 8, Graphics.ARC_CLOCKWISE, 0, 360);
        dc.drawArc(cx, cy, cx - 9, Graphics.ARC_CLOCKWISE, 0, 360);

        // Current time
        var clock = System.getClockTime();
        var timeStr = clock.hour.format("%02d") + ":" + clock.min.format("%02d");
        dc.setColor(Graphics.COLOR_WHITE, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy - 30, Graphics.FONT_NUMBER_HOT, timeStr, Graphics.TEXT_JUSTIFY_CENTER);

        // Licensed badge
        dc.setColor(0x00CC55, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy + 30, Graphics.FONT_TINY, "LICENSED", Graphics.TEXT_JUSTIFY_CENTER);

        // Device serial (truncated for display)
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        var shortSerial = _deviceSerial.length() > 12
            ? _deviceSerial.substring(0, 12) + "..."
            : _deviceSerial;
        dc.drawText(cx, h - 40, Graphics.FONT_XTINY, shortSerial, Graphics.TEXT_JUSTIFY_CENTER);
    }

    private function drawLocked(dc as Graphics.Dc, cx as Number, cy as Number) as Void {
        // Red border ring
        dc.setColor(Graphics.COLOR_RED, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(cx, cy, cx - 8, Graphics.ARC_CLOCKWISE, 0, 360);
        dc.drawArc(cx, cy, cx - 9, Graphics.ARC_CLOCKWISE, 0, 360);

        dc.setColor(Graphics.COLOR_RED, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy - 20, Graphics.FONT_LARGE, "LOCKED", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy + 20, Graphics.FONT_TINY, "Purchase at wewatch.app", Graphics.TEXT_JUSTIFY_CENTER);
    }

    private function drawError(dc as Graphics.Dc, cx as Number, cy as Number) as Void {
        dc.setColor(Graphics.COLOR_YELLOW, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy - 20, Graphics.FONT_MEDIUM, "Network Error", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy + 10, Graphics.FONT_TINY, "Check connection", Graphics.TEXT_JUSTIFY_CENTER);
    }
}
