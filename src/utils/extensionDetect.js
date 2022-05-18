const requiredVersion = '1.0';

export const browserIsChrome = () => {
    var isChromium = window.chrome;
    var winNav = window.navigator;
    var vendorName = winNav.vendor;
    return isChromium !== null &&
        typeof isChromium !== "undefined" &&
        vendorName === "Google Inc."
};

export const browserIsFirefox = () => {
    return window.navigator.userAgent.match(/firefox|fxios/i);
};

export const extensionIsInstalled = async () => {
    if (browserIsChrome()) {
        let hasExtension = false;
        if (chrome === undefined || chrome.runtime === undefined || chrome.runtime.sendMessage == undefined) {
            return false;
        }
        await chrome.runtime.sendMessage('fmpjamnhdgmanehbfhffkmphobhabanb', { message: "version" },
            (reply) => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
                if (reply) {
                    if (reply.version) {
                        if (reply.version >= requiredVersion) {
                            hasExtension = true;
                        }
                    }
                }
                else {
                    hasExtension = false;
                }
            });
        return hasExtension;
    } else if (browserIsFirefox()) {
        return (window.getRpExtVersion !== undefined);
    }
    return false;
}
