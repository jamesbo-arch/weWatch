// weWatch Watch Face · 视图（生成器主要的注入对象）
//
// 生成器会按 IR.layout.elements 顺序注入 draw_<element_id> 函数，
// 并在 onUpdate / onPartialUpdate 中按可见性调用。
//
// 占位符：
//   {{IMPORTS}}              - 按 element 类型派生的 import（Activity / ActivityMonitor / Weather 等）
//   {{ELEMENT_DRAW_CALLS}}   - onUpdate 中按顺序调用各 draw_* 函数
//   {{AOD_DRAW_CALLS}}       - onPartialUpdate 中调用 aod_visible 元素
//   {{ELEMENT_DRAW_FNS}}     - 各 draw_<id> 函数体
//   {{HELPERS}}              - 派生的工具函数（颜色解析、字体映射等）

import Toybox.WatchUi;
import Toybox.Graphics;
import Toybox.System;
import Toybox.Lang;
import Toybox.Application;
{{IMPORTS}}

class WeWatchView extends WatchUi.WatchFace {

    private var _w as Lang.Number = 0;
    private var _h as Lang.Number = 0;
    private var _isAod as Lang.Boolean = false;
    private var _bgColor as Lang.Number = 0x000000;

    function initialize() {
        WatchFace.initialize();
    }

    function onLayout(dc as Graphics.Dc) as Void {
        _w = dc.getWidth();
        _h = dc.getHeight();
        _bgColor = loadColor(:ColorBackground);
        // 预加载所有 BitmapResource 到成员（生成器按需追加）
        // {{PRELOAD_BITMAPS}}
    }

    function onShow() as Void {}
    function onHide() as Void {}

    function onUpdate(dc as Graphics.Dc) as Void {
        dc.setColor(Graphics.COLOR_TRANSPARENT, _bgColor);
        dc.clear();

        drawBackground(dc);

        {{ELEMENT_DRAW_CALLS}}
    }

    function onPartialUpdate(dc as Graphics.Dc) as Void {
        // AOD 模式：仅调用 aod_visible 元素，使用 setClip 限定区域
        {{AOD_DRAW_CALLS}}
    }

    function onEnterSleep() as Void {
        _isAod = true;
        WatchUi.requestUpdate();
    }

    function onExitSleep() as Void {
        _isAod = false;
        WatchUi.requestUpdate();
    }

    // ---------- 背景绘制 ----------
    private function drawBackground(dc as Graphics.Dc) as Void {
        // {{BACKGROUND_BODY}}
    }

    // ---------- 元素绘制函数（生成器注入） ----------
    {{ELEMENT_DRAW_FNS}}

    // ---------- 工具函数 ----------
    private function loadColor(sym as Lang.Symbol) as Lang.Number {
        return Application.loadResource(Rez.Colors[sym]) as Lang.Number;
    }

    {{HELPERS}}
}
