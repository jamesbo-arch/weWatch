import Toybox.Activity;
import Toybox.ActivityMonitor;
import Toybox.Communications;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;
import Toybox.Time.Gregorian;
import Toybox.WatchUi;

enum LicenseState {
    STATE_LOADING,
    STATE_UNLOCKED,
    STATE_LOCKED,
    STATE_ERROR
}

// Dynamic watch face renderer — reads a Render Spec JSON from the API and
// draws each element at runtime, so no recompile is needed for new designs.
class LicenseDemoView extends WatchUi.WatchFace {

    private var _state as LicenseState = STATE_LOADING;
    private var _renderSpec as Lang.Dictionary?;
    private var _bgBitmap as Graphics.BitmapReference?;

    function initialize() {
        WatchFace.initialize();
    }

    function onLayout(dc as Graphics.Dc) as Void {
    }

    function onShow() as Void {
        var spec = _renderSpec;
        if (spec == null) { return; }
        if (Communications has :makeImageRequest) {
            var bgImg = spec["bg_img"];
            if (bgImg != null) {
                Communications.makeImageRequest(
                    bgImg.toString(),
                    null,
                    { :width => 260, :height => 260 },
                    method(:onImageResponse)
                );
            }
        }
    }

    function onImageResponse(responseCode as Number, data as Graphics.BitmapReference?) as Void {
        if (responseCode == 200 && data != null) {
            _bgBitmap = data;
            WatchUi.requestUpdate();
        }
    }

    function onExitSleep() as Void {}
    function onEnterSleep() as Void {}

    function setState(state as LicenseState) as Void {
        _state = state;
        WatchUi.requestUpdate();
    }

    function setRenderSpec(spec as Lang.Dictionary) as Void {
        _renderSpec = spec;
        WatchUi.requestUpdate();
    }

    function setBackgroundImage(bitmap as Graphics.BitmapReference) as Void {
        _bgBitmap = bitmap;
        WatchUi.requestUpdate();
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var w = dc.getWidth();
        var h = dc.getHeight();

        if (_state == STATE_LOADING) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            drawLoading(dc, w / 2, h / 2);
            return;
        }

        if (_state == STATE_LOCKED) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            drawLocked(dc, w / 2, h / 2);
            return;
        }

        if (_state == STATE_ERROR) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            drawError(dc, w / 2, h / 2);
            return;
        }

        // STATE_UNLOCKED — render from spec
        var spec = _renderSpec;
        if (spec == null) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            drawLoading(dc, w / 2, h / 2);
            return;
        }

        renderSpec(dc, spec, w, h);
    }

    // ── Spec Renderer ────────────────────────────────────────────────────────

    private function renderSpec(dc as Graphics.Dc, spec as Lang.Dictionary, w as Number, h as Number) as Void {
        var bgBitmap = _bgBitmap;
        if (bgBitmap != null) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            dc.drawBitmap(0, 0, bgBitmap);
        } else {
            var bgHex = spec["bg"];
            var bgColor = (bgHex != null) ? parseColor(bgHex.toString()) : Graphics.COLOR_BLACK;
            dc.setColor(bgColor, bgColor);
            dc.clear();
        }

        var elements = spec["elements"];
        if (elements == null || !(elements instanceof Lang.Array)) {
            return;
        }
        var arr = elements as Lang.Array;
        for (var i = 0; i < arr.size(); i++) {
            var el = arr[i];
            if (!(el instanceof Lang.Dictionary)) { continue; }
            var elem = el as Lang.Dictionary;
            var t = elem["t"];
            if (t == null) { continue; }
            var type = t.toString();

            if (type.equals("arc"))          { drawSpecArc(dc, elem, w, h); }
            else if (type.equals("time"))    { drawSpecTime(dc, elem, w, h); }
            else if (type.equals("text"))    { drawSpecText(dc, elem, w, h); }
            else if (type.equals("date"))    { drawSpecDate(dc, elem, w, h); }
            else if (type.equals("steps"))   { drawSpecSteps(dc, elem, w, h); }
            else if (type.equals("heart"))   { drawSpecHeart(dc, elem, w, h); }
            else if (type.equals("battery")) { drawSpecBattery(dc, elem, w, h); }
        }
    }

    // ── Element Draw Functions ───────────────────────────────────────────────

    private function drawSpecArc(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var color = elColor(el, Graphics.COLOR_GREEN);
        var rOffset = elInt(el, "r", 8);
        var cx = w / 2;
        var cy = h / 2;
        var radius = (cx < cy ? cx : cy) - rOffset;
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(cx, cy, radius, Graphics.ARC_CLOCKWISE, 0, 360);
        dc.drawArc(cx, cy, radius - 1, Graphics.ARC_CLOCKWISE, 0, 360);
    }

    private function drawSpecTime(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var clock = System.getClockTime();
        var timeStr = clock.hour.format("%02d") + ":" + clock.min.format("%02d");
        var px = pctX(elInt(el, "x", 50), w);
        var py = pctY(elInt(el, "y", 42), h);
        dc.setColor(elColor(el, Graphics.COLOR_WHITE), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), timeStr,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSpecText(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var v = el["v"];
        if (v == null) { return; }
        var px = pctX(elInt(el, "x", 50), w);
        var py = pctY(elInt(el, "y", 60), h);
        dc.setColor(elColor(el, Graphics.COLOR_LT_GRAY), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), v.toString(),
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSpecDate(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var today = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        var dateStr = today.month.format("%02d") + "/" + today.day.format("%02d");
        var px = pctX(elInt(el, "x", 50), w);
        var py = pctY(elInt(el, "y", 72), h);
        dc.setColor(elColor(el, Graphics.COLOR_DK_GRAY), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), dateStr,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSpecSteps(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var info = ActivityMonitor.getInfo();
        var steps = (info.steps != null) ? info.steps.toString() : "--";
        var px = pctX(elInt(el, "x", 50), w);
        var py = pctY(elInt(el, "y", 82), h);
        dc.setColor(elColor(el, Graphics.COLOR_BLUE), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), steps + " stp",
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSpecHeart(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var info = Activity.getActivityInfo();
        var hr = (info != null && info.currentHeartRate != null) ? info.currentHeartRate.toString() : "--";
        var px = pctX(elInt(el, "x", 25), w);
        var py = pctY(elInt(el, "y", 82), h);
        dc.setColor(elColor(el, Graphics.COLOR_RED), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), hr + " bpm",
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSpecBattery(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var stats = System.getSystemStats();
        var pct = stats.battery.format("%d") + "%";
        var px = pctX(elInt(el, "x", 75), w);
        var py = pctY(elInt(el, "y", 82), h);
        dc.setColor(elColor(el, Graphics.COLOR_YELLOW), Graphics.COLOR_TRANSPARENT);
        dc.drawText(px, py, resolveFont(el["f"]), pct,
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    // ── Static State Screens ─────────────────────────────────────────────────

    private function drawLoading(dc as Graphics.Dc, cx as Number, cy as Number) as Void {
        dc.setColor(Graphics.COLOR_LT_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy - 20, Graphics.FONT_MEDIUM, "weWatch", Graphics.TEXT_JUSTIFY_CENTER);
        dc.setColor(Graphics.COLOR_DK_GRAY, Graphics.COLOR_TRANSPARENT);
        dc.drawText(cx, cy + 10, Graphics.FONT_SMALL, "Loading...", Graphics.TEXT_JUSTIFY_CENTER);
    }

    private function drawLocked(dc as Graphics.Dc, cx as Number, cy as Number) as Void {
        dc.setColor(Graphics.COLOR_RED, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(cx, cy, cx - 8, Graphics.ARC_CLOCKWISE, 0, 360);
        dc.drawArc(cx, cy, cx - 9, Graphics.ARC_CLOCKWISE, 0, 360);
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

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function parseColor(hex as String) as Number {
        if (hex.length() < 6) { return Graphics.COLOR_WHITE; }
        var r = hexByte(hex.substring(0, 2));
        var g = hexByte(hex.substring(2, 4));
        var b = hexByte(hex.substring(4, 6));
        return (r << 16) | (g << 8) | b;
    }

    private function hexByte(s as String) as Number {
        var hi = hexNibble(s.substring(0, 1).toCharArray()[0]);
        var lo = hexNibble(s.substring(1, 2).toCharArray()[0]);
        return (hi << 4) | lo;
    }

    private function hexNibble(c as Char) as Number {
        if (c >= '0' && c <= '9') { return c.toNumber() - '0'.toNumber(); }
        if (c >= 'a' && c <= 'f') { return c.toNumber() - 'a'.toNumber() + 10; }
        if (c >= 'A' && c <= 'F') { return c.toNumber() - 'A'.toNumber() + 10; }
        return 0;
    }

    private function resolveFont(f as Lang.Object?) as Graphics.FontType {
        if (f == null) { return Graphics.FONT_SMALL; }
        var s = f.toString();
        if (s.equals("hot"))    { return Graphics.FONT_NUMBER_HOT; }
        if (s.equals("medium")) { return Graphics.FONT_MEDIUM; }
        if (s.equals("small"))  { return Graphics.FONT_SMALL; }
        if (s.equals("tiny"))   { return Graphics.FONT_TINY; }
        if (s.equals("xtiny"))  { return Graphics.FONT_XTINY; }
        return Graphics.FONT_SMALL;
    }

    private function elColor(el as Lang.Dictionary, fallback as Number) as Number {
        var c = el["c"];
        return (c != null) ? parseColor(c.toString()) : fallback;
    }

    private function elInt(el as Lang.Dictionary, key as String, fallback as Number) as Number {
        var v = el[key];
        if (v == null) { return fallback; }
        if (v instanceof Lang.Number) { return v as Number; }
        return fallback;
    }

    private function pctX(pct as Number, w as Number) as Number {
        return (w * pct) / 100;
    }

    private function pctY(pct as Number, h as Number) as Number {
        return (h * pct) / 100;
    }
}
