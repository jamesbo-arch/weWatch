import Toybox.Activity;
import Toybox.ActivityMonitor;
import Toybox.Graphics;
import Toybox.Lang;
import Toybox.System;
import Toybox.Time;
import Toybox.Time.Gregorian;
import Toybox.WatchUi;

// Replays the background animation on completion, ensuring it loops forever
// even if the .mm resource was compiled without the looping flag.
class AnimDelegate extends WatchUi.AnimationDelegate {
    private var _view as LicenseDemoView;
    function initialize(view as LicenseDemoView) {
        AnimationDelegate.initialize();
        _view = view;
    }
    function onAnimationEvent(event as AnimationEvent, options as Lang.Dictionary) as Void {
        if (event == WatchUi.ANIMATION_EVENT_COMPLETE) {
            _view.replayAnimation();
        }
    }
}

enum LicenseState {
    STATE_LOADING,
    STATE_UNLOCKED,
    STATE_LOCKED,
    STATE_ERROR
}

// Watch face with optional animated background.
// When bg_anim is set, elements are drawn into a transparent Layer
// composited on top of the AnimationLayer — exactly matching the
// official Garmin AnimationWatchFace sample pattern.
class LicenseDemoView extends WatchUi.WatchFace {

    private var _state as LicenseState = STATE_LOADING;
    private var _renderSpec as Lang.Dictionary?;
    private var _animLayer as WatchUi.AnimationLayer?;
    private var _overlayLayer as WatchUi.Layer?;

    function initialize() {
        WatchFace.initialize();
    }

    function onLayout(dc as Graphics.Dc) as Void {
        _animLayer = new WatchUi.AnimationLayer(Rez.Drawables.bg_aurora_wave, {});
        addLayer(_animLayer);
        // Start visible so we can test if animation itself works.
        _animLayer.setVisible(true);
        _animLayer.play({:delegate => new AnimDelegate(self)});

        // Overlay layer holds the spec elements on top of the animation.
        _overlayLayer = new WatchUi.Layer({});
        addLayer(_overlayLayer);
        // Sync visibility now that layers exist (covers cached spec case).
        updateLayers();
    }

    function onShow() as Void {
        // Always prepare the animation. play() on a hidden layer is harmless;
        // updateLayers() will set visibility when the spec arrives.
        if (_animLayer != null) {
                    _animLayer.play({:delegate => new AnimDelegate(self)});;
        }
    }

    function onExitSleep() as Void {
        if (_animLayer != null) {
                    _animLayer.play({:delegate => new AnimDelegate(self)});;
        }
    }

    function onEnterSleep() as Void {
        if (_animLayer != null) {
            _animLayer.stop();
        }
    }

    function setState(state as LicenseState) as Void {
        _state = state;
        updateLayers();
        WatchUi.requestUpdate();
    }

    function setRenderSpec(spec as Lang.Dictionary) as Void {
        _renderSpec = spec;
        // Don't call updateLayers() here — _state hasn't been updated yet.
        // setState() will follow immediately and handle visibility + requestUpdate.
    }

    // ── Layer Visibility ────────────────────────────────────────────────────

    private function updateLayers() as Void {
        var spec = _renderSpec;
        var unlocked = (_state == STATE_UNLOCKED && spec != null);
        var useAnim = unlocked && spec["bg_anim"] != null;

        if (_overlayLayer != null) {
            _overlayLayer.setVisible(unlocked);
        }
        if (_animLayer != null) {
            _animLayer.setVisible(useAnim);
            if (useAnim) {
                _animLayer.play({:delegate => new AnimDelegate(self)});
            } else {
                _animLayer.stop();
            }
        }
    }

    // Called by AnimDelegate when animation reaches end of loop.
    // Re-starts playback so the background never stops.
    function replayAnimation() as Void {
        if (_animLayer != null && _animLayer.isVisible()) {
            _animLayer.play({:delegate => new AnimDelegate(self)});
        }
    }

    // ── onUpdate ────────────────────────────────────────────────────────────

    function onUpdate(dc as Graphics.Dc) as Void {
        var w = dc.getWidth();
        var h = dc.getHeight();

        // Static state screens — layers are hidden, draw directly to View DC.
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

        var spec = _renderSpec;
        if (spec == null) {
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
            drawLoading(dc, w / 2, h / 2);
            return;
        }

        var useAnim = spec["bg_anim"] != null;

        if (useAnim) {
            // AnimationLayer plays beneath. Draw elements into the transparent
            // overlay layer DC (same pattern as Garmin's AnimationWatchFace sample).
            if (_overlayLayer != null) {
                var layerDc = _overlayLayer.getDc();
                if (layerDc != null) {
                    // Clear with transparent background so animation shows through.
                    layerDc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_TRANSPARENT);
                    layerDc.clear();
                    drawElements(layerDc, spec, layerDc.getWidth(), layerDc.getHeight());
                }
            }
            // Clear the View DC to black so nothing shows through gaps.
            dc.setColor(Graphics.COLOR_BLACK, Graphics.COLOR_BLACK);
            dc.clear();
        } else {
            // No animation — draw everything directly to View DC (proven path).
            drawSpecDirect(dc, spec, w, h);
        }
    }

    // ── Direct drawing (non-animated path) ──────────────────────────────────

    private function drawSpecDirect(dc as Graphics.Dc, spec as Lang.Dictionary, w as Number, h as Number) as Void {
        var bgColor = parseColor(getString(spec, "bg", "000000"));
        dc.setColor(bgColor, bgColor);
        dc.clear();

        var bgImg = spec["bg_img"];
        if (bgImg != null) { drawBgImage(dc, bgImg.toString()); }

        drawElements(dc, spec, w, h);
    }

    // ── Element dispatch (shared by both paths) ─────────────────────────────

    private function drawElements(dc as Graphics.Dc, spec as Lang.Dictionary, w as Number, h as Number) as Void {
        var elements = spec["elements"];
        if (elements == null || !(elements instanceof Lang.Array)) { return; }
        var arr = elements as Lang.Array;
        for (var i = 0; i < arr.size(); i++) {
            var el = arr[i];
            if (!(el instanceof Lang.Dictionary)) { continue; }
            var elem = el as Lang.Dictionary;
            var t = elem["t"];
            if (t == null) { continue; }
            var type = t.toString();

            if (type.equals("gradient"))     { drawGradient(dc, elem, w, h); }
            else if (type.equals("arc"))     { drawArc(dc, elem, w, h); }
            else if (type.equals("time"))    { drawTime(dc, elem, w, h); }
            else if (type.equals("text"))    { drawText(dc, elem, w, h); }
            else if (type.equals("date"))    { drawDate(dc, elem, w, h); }
            else if (type.equals("steps"))   { drawSteps(dc, elem, w, h); }
            else if (type.equals("heart"))   { drawHeart(dc, elem, w, h); }
            else if (type.equals("battery")) { drawBattery(dc, elem, w, h); }
        }
    }

    // ── Element Draw Functions ───────────────────────────────────────────────

    private function drawGradient(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var cx = w / 2; var cy = h / 2;
        var maxR = (cx < cy ? cx : cy);
        var steps = elInt(el, "steps", 15);
        if (steps < 2) { steps = 2; }
        var c1 = parseColor(getString(el, "c1", "FF4400"));
        var c2 = parseColor(getString(el, "c2", "000000"));
        var r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
        var r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
        for (var i = 0; i < steps; i++) {
            var radius = maxR - (maxR * i / steps);
            var ri = r2 + (r1 - r2) * i / steps;
            var gi = g2 + (g1 - g2) * i / steps;
            var bi = b2 + (b1 - b2) * i / steps;
            dc.setColor((ri << 16) | (gi << 8) | bi, Graphics.COLOR_TRANSPARENT);
            dc.fillCircle(cx, cy, radius);
        }
    }

    private function drawArc(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var color = elColor(el, Graphics.COLOR_GREEN);
        var cx = w / 2; var cy = h / 2;
        var radius = (cx < cy ? cx : cy) - elInt(el, "r", 8);
        dc.setColor(color, Graphics.COLOR_TRANSPARENT);
        dc.drawArc(cx, cy, radius, Graphics.ARC_CLOCKWISE, 0, 360);
        dc.drawArc(cx, cy, radius - 1, Graphics.ARC_CLOCKWISE, 0, 360);
    }

    private function drawTime(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var clock = System.getClockTime();
        var timeStr = clock.hour.format("%02d") + ":" + clock.min.format("%02d");
        dc.setColor(elColor(el, Graphics.COLOR_WHITE), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 50), w), pctY(elInt(el, "y", 42), h),
            resolveFont(el["f"]), timeStr, Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawText(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var v = el["v"]; if (v == null) { return; }
        dc.setColor(elColor(el, Graphics.COLOR_LT_GRAY), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 50), w), pctY(elInt(el, "y", 60), h),
            resolveFont(el["f"]), v.toString(), Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawDate(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var today = Gregorian.info(Time.now(), Time.FORMAT_SHORT);
        dc.setColor(elColor(el, Graphics.COLOR_DK_GRAY), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 50), w), pctY(elInt(el, "y", 72), h),
            resolveFont(el["f"]), today.month.format("%02d") + "/" + today.day.format("%02d"),
            Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawSteps(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var info = ActivityMonitor.getInfo();
        var steps = (info.steps != null) ? info.steps.toString() : "--";
        dc.setColor(elColor(el, Graphics.COLOR_BLUE), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 50), w), pctY(elInt(el, "y", 82), h),
            resolveFont(el["f"]), steps + " stp", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawHeart(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var info = Activity.getActivityInfo();
        var hr = (info != null && info.currentHeartRate != null) ? info.currentHeartRate.toString() : "--";
        dc.setColor(elColor(el, Graphics.COLOR_RED), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 25), w), pctY(elInt(el, "y", 82), h),
            resolveFont(el["f"]), hr + " bpm", Graphics.TEXT_JUSTIFY_CENTER | Graphics.TEXT_JUSTIFY_VCENTER);
    }

    private function drawBattery(dc as Graphics.Dc, el as Lang.Dictionary, w as Number, h as Number) as Void {
        var stats = System.getSystemStats();
        dc.setColor(elColor(el, Graphics.COLOR_YELLOW), Graphics.COLOR_TRANSPARENT);
        dc.drawText(pctX(elInt(el, "x", 75), w), pctY(elInt(el, "y", 82), h),
            resolveFont(el["f"]), stats.battery.format("%d") + "%",
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

    private function drawBgImage(dc as Graphics.Dc, key as String) as Void {
        var resId = null;
        if (key.equals("aurora"))  { resId = Rez.Drawables.bg_aurora; }
        else if (key.equals("nebula")) { resId = Rez.Drawables.bg_nebula; }
        if (resId == null) { return; }
        dc.drawBitmap(0, 0, WatchUi.loadResource(resId) as WatchUi.BitmapResource);
    }

    private function parseColor(hex as String) as Number {
        if (hex.length() < 6) { return Graphics.COLOR_WHITE; }
        var r = hexByte(hex.substring(0, 2));
        var g = hexByte(hex.substring(2, 4));
        var b = hexByte(hex.substring(4, 6));
        return (r << 16) | (g << 8) | b;
    }

    private function hexByte(s as String) as Number {
        return (hexNibble(s.toCharArray()[0]) << 4) | hexNibble(s.toCharArray()[1]);
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

    private function getString(el as Lang.Dictionary, key as String, fallback as String) as String {
        var v = el[key];
        return (v != null) ? v.toString() : fallback;
    }

    private function pctX(pct as Number, w as Number) as Number { return (w * pct) / 100; }
    private function pctY(pct as Number, h as Number) as Number { return (h * pct) / 100; }
}
