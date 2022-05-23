const requiredVersion = 1.0;

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

/*global chrome*/
export const extensionIsInstalled = () => {
    if (browserIsChrome()) {
        if (chrome === undefined || chrome.runtime === undefined || chrome.runtime.sendMessage === undefined) {
            return Promise.resolve(false);
        }
        return new Promise((resolve => {
            chrome.runtime.sendMessage('bgodmjchmhnpgccglldbfddddignglep', { message: "version" },
            (reply) => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                    resolve(false);
                }
                if (reply) {
                    if (reply.version) {
                        if (reply.version >= requiredVersion) {
                            resolve(true);
                        }
                    }
                }
                else {
                    resolve(false);
                }
                });
        }))
    } else if (browserIsFirefox()) {
        return Promise.resolve((window.getRpExtVersion !== undefined));
    }
    return Promise.resolve(false);
}
