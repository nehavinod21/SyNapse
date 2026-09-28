/** iPad/iPhone Safari needs HTTPS (or localhost) for getUserMedia. */

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isSecureCameraContext() {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function cameraBlockedReason(lang = "en") {
  if (!isSecureCameraContext()) {
    if (isIOS()) {
      return lang === "ar"
        ? "?????/iOS ????? HTTPS ????????. ?????? ??? Cloudflare (???? DEPLOY_IPAD.md) ?? ???? ??? ?????????."
        : "iPad/iOS requires HTTPS for the camera. Use a Cloudflare/ngrok HTTPS URL (see DEPLOY_IPAD.md) or demo on PC.";
    }
    return lang === "ar"
      ? "???????? ????? ??????? ????? (HTTPS)."
      : "Camera requires a secure connection (HTTPS).";
  }
  return null;
}

export function iosVideoConstraints() {
  return {
    facingMode: "user",
    width: { ideal: 640 },
    height: { ideal: 480 },
  };
}

export function defaultVideoConstraints() {
  return {
    facingMode: "user",
    width: { ideal: 480 },
    height: { ideal: 360 },
  };
}
