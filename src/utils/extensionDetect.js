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

export const browserIsSafari = () => {
    return window.navigator.userAgent.match(/Safari/i) && !window.navigator.userAgent.match(/Chrome/i)
}

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
        if (window.getRpExtVersion !== undefined) {
            const version = window.getRpExtVersion();
            return Promise.resolve(version >= requiredVersion);
        } else {
            return Promise.resolve(false);
        }
    } else if (browserIsSafari())
    {
    // eslint-disable-next-line no-undef
/*         const extensionPort = browser.runtime.connect("com.randoplan.extension.Extension (2B6A6N9QBQ)")
        extensionPort.onMessage.addListener((message) => {
            console.log(`From extension: ${message.content}`);
        });
 */        //eslint-disable-next-line no-undef
        browser.runtime.sendMessage("com.randoplan.extension.Extension (2B6A6N9QBQ)", {message: "version"}, function(response) {
            console.log("Response from extension detection", response)
            if (response && response.version) {
                return Promise.resolve(response.version >= requiredVersion)
            } else
            return Promise.resolve(false);
        });
    }
    return Promise.resolve(false);
}
