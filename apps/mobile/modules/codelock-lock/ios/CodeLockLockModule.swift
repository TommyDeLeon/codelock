import ExpoModulesCore

/**
 * iOS, honestly.
 *
 * There is no public API that lets one app draw over another or prevent the
 * user from leaving. This is a platform decision, not a gap in this code, and
 * no amount of effort here changes it. The nearest sanctioned mechanism is the
 * FamilyControls / ManagedSettings entitlement, which Apple grants case by
 * case, requires a separate DeviceActivityMonitor extension, and is scoped to
 * parental-control products.
 *
 * So this module reports `isSupported: false` and every enforcement call
 * returns false. The JS layer reads that and renders the soft lock — CodeLock
 * takes over its own screen and notifies — rather than implying a block it
 * cannot deliver. Every claim in the product copy is gated on this constant.
 */
public class CodeLockLockModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CodeLockLock")

    Constants([
      "isSupported": false,
      "platform": "ios",
    ])

    Function("canDrawOverlay") { () -> Bool in false }
    Function("openOverlaySettings") { () -> Bool in false }
    Function("openBatterySettings") { () -> Bool in false }
    Function("isLocked") { () -> Bool in false }
    Function("engage") { (_ sessionId: String, _ webUrl: String, _ accessToken: String) -> Bool in
      false
    }
    Function("release") { () -> Bool in false }
  }
}
