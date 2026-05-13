import Toybox.Activity;
import Toybox.ActivityMonitor;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;
import Toybox.Time.Gregorian;
import Toybox.WatchUi;
import Toybox.Application.Storage;

// Draws Render Spec elements as a Layer, composited on top of the
// background (which may be a static fill, bitmap, or AnimationLayer).
class RenderSpecLayer extends WatchUi.Layer {

    private var _spec as Lang.Dictionary?;
    // Cache the last bg_img key to avoid reloading bitmap every frame.
    private var _bgImgKey as String?;
    private var _bgBmp as WatchUi.BitmapResource?;

    function initialize() {
        Layer.initialize({});
    }

    function setSpec(spec as Lang.Dictionary?) as Void {
        _spec = spec;
        _bgImgKey = null;
        _bgBmp = null;
    }

    // Called by the View after setSpec + setVisible to guarantee a redraw.
    function requestRefresh() as Void {
        if (_spec != null) {
            WatchUi.requestUpdate();
        }
    }

    function onUpdate(dc as Graphics.Dc) as Void {
        var spec = _spec;
        if (spec == null) { return; }
        renderSpec(dc, spec, dc.getWidth(), dc.getHeight());
    }

    // ── Spec Renderer ────────────────────────────────────────────────────────

    private function renderSpec(dc as Graphics.Dc, spec as Lang.Dictionary, w as Number, h as Number) as Void {
        var hasAnim = spec["bg_anim"] != null;

        if (!hasAnim) {
            // Static background — fill + optional bitmap/gradient
            var bgHex = spec["bg"];
            var bgColor = (bgHex != null) ? parseColor(bgHex.toString()) : Graphics.COLOR_BLACK;
            dc.setColor(bgColor, bgColor);
            dc.clear();

            var bgImg = spec["bg_img"];
            if (bgImg != null) { drawBgImage(dc, bgImg.toString()); }
        }
        // When bg_anim is set, the AnimationLayer beneath us provides the
        // background — we draw only the elements on top.

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

            if (type.equals("gradient"))     { drawSpecGradient(dc, elem, w, h); }
            else if (type.equals("arc"))     { drawSpecArc(dc, elem, w, h); }
            else if (type.equals("time"))    { drawSpecTime(dc, elem, w, h); }
            else if (type.equals("text"))    { drawSpecText(dc, elem, w, h); }
            else if (type.equals("date"))    { drawSpecDate(dc, elem, w, h); }
            else if (type.equals("steps"))   { drawSpecSteps(dc, elem, w, h); }
            else if (type.equals("heart"))   { drawSpecHeart(dc, elem, w, h); }
            else if (type.equals("battery")) { drawSpecBattery(dc, elem, w, h); }
        }
    }

    // ── Element Draw Functions ───────────────────────────────────────────────

    private function drawSpecGradient(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var cx = w / 2;
        var cy = h / 2;
        var maxR = (cx < cy ? cx : cy);
        var steps = elInt(el, "steps", 15);
        if (steps < 2) { steps = 2; }

        var c1val = el["c1"];
        var c2val = el["c2"];
        var c1 = (c1val != null) ? parseColor(c1val.toString()) : 0xFF4400;
        var c2 = (c2val != null) ? parseColor(c2val.toString()) : 0x000000;

        var r1 = (c1 >> 16) & 0xFF;
        var g1 = (c1 >> 8) & 0xFF;
        var b1 = c1 & 0xFF;
        var r2 = (c2 >> 16) & 0xFF;
        var g2 = (c2 >> 8) & 0xFF;
        var b2 = c2 & 0xFF;

        for (var i = 0; i < steps; i++) {
            var radius = maxR - (maxR * i / steps);
            var ri = r2 + (r1 - r2) * i / steps;
            var gi = g2 + (g1 - g2) * i / steps;
            var bi = b2 + (b1 - b2) * i / steps;
            var color = (ri << 16) | (gi << 8) | bi;
            dc.setColor(color, Graphics.COLOR_TRANSPARENT);
            dc.fillCircle(cx, cy, radius);
        }
    }

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

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function drawBgImage(dc as Graphics.Dc, key as String) as Void {
        if (!key.equals(_bgImgKey)) {
            var resId = null;
            if (key.equals("aurora"))  { resId = Rez.Drawables.bg_aurora; }
            else if (key.equals("nebula")) { resId = Rez.Drawables.bg_nebula; }
            if (resId == null) { return; }
            _bgBmp = WatchUi.loadResource(resId) as WatchUi.BitmapResource;
            _bgImgKey = key;
        }
        if (_bgBmp != null) {
            dc.drawBitmap(0, 0, _bgBmp);
        }
    }

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
        if (v instanceof Lang.Float)  { return (v as Lang.Float).toNumber(); }
        return fallback;
    }

    private function pctX(pct as Number, w as Number) as Number {
        return (w * pct) / 100;
    }

    private function pctY(pct as Number, h as Number) as Number {
        return (h * pct) / 100;
    }
}
