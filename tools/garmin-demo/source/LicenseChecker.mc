import Toybox.Communications;
import Toybox.Lang;
import Toybox.System;

// Handles HTTP license activation and verification against the weWatch API.
// Garmin simulator routes HTTP through the host machine's loopback, so
// use the host machine's LAN IP (not 127.0.0.1) when testing locally.
(:background)
class LicenseChecker {

    // --- Configuration ---
    // For local dev: set to your machine's LAN IP, e.g. "http://192.168.1.x:3001"
    // For production: set to "https://api.wewatch.app"
    private var _apiBase as String = "http://192.168.155.81:3001";
    private var _watchfaceId as String = "24669676-c951-4dac-8c6e-052d57c0dfd3"; // Midnight Minimal
    // ---------------------

    // POST /api/v1/licenses/activate
    function activate(callback as Lang.Method) as Void {
        var serial = getDeviceSerial();
        var url = _apiBase + "/api/v1/licenses/activate";
        var params = {
            "deviceSerial" => serial,
            "watchfaceId"  => _watchfaceId
        };
        var options = {
            :method  => Communications.HTTP_REQUEST_METHOD_POST,
            :headers => { "Content-Type" => Communications.REQUEST_CONTENT_TYPE_JSON },
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };
        Communications.makeWebRequest(url, params, options, callback);
    }

    // GET /api/v1/licenses/check?deviceSerial=xxx&watchfaceId=yyy
    function check(callback as Lang.Method) as Void {
        var serial = getDeviceSerial();
        var url = _apiBase + "/api/v1/licenses/check";
        var params = {
            "deviceSerial" => serial,
            "watchfaceId"  => _watchfaceId
        };
        var options = {
            :method       => Communications.HTTP_REQUEST_METHOD_GET,
            :responseType => Communications.HTTP_RESPONSE_CONTENT_TYPE_JSON
        };
        Communications.makeWebRequest(url, params, options, callback);
    }

    function getDeviceSerial() as String {
        var settings = System.getDeviceSettings();
        var uid = settings.uniqueIdentifier;
        if (uid == null) {
            return "UNKNOWN";
        }
        return uid;
    }
}
