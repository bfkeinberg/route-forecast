import { AnchorButton,Button, ButtonGroup } from "@blueprintjs/core";
import React, {useEffect,useState} from "react";
import cookie from 'react-cookies';

import { browserIsChrome, browserIsFirefox, browserIsSafari,extensionIsInstalled } from "../utils/extensionDetect";

export const InstallExtensionButton = () => {
    const [
        promptForExtensionInstall,
        setPromptForExtensionInstall
    ] = useState<boolean>(!cookie.load('muteExtensionInstallPrompt'))

    const [
        isInstalled,
        setIsInstalled
    ] = useState<boolean|undefined>(undefined);

    useEffect(() => {
        const checkIfInstalled = async () => {
            setIsInstalled(await extensionIsInstalled());
        }
        checkIfInstalled();
    })

    const mutePrompt = () => {
        cookie.save('muteExtensionInstallPrompt', "true", { path: '/' } )
        setPromptForExtensionInstall(false)
    }

    if (isInstalled || !promptForExtensionInstall) {
        // console.info('Extension is installed');
        return null;
    }
    if (isInstalled !== undefined) {
        if (browserIsChrome()) {
            console.info('Extension not installed');
            return (
                <ButtonGroup>
                    <AnchorButton text={"Install Chrome extension for randoplan"} href={"https://chrome.google.com/webstore/detail/randoplan-extension/bgodmjchmhnpgccglldbfddddignglep"}/>
                    <Button text="Nope" onClick={mutePrompt}/>
                </ButtonGroup>
            )
        }
        if (browserIsFirefox()) {
            return (
                <ButtonGroup>
                    <AnchorButton text={"Install Firefox extension for randoplan"} href={"https://addons.mozilla.org/en-US/firefox/addon/randoplan-extension/"} />
                    <Button text="Nope" onClick={mutePrompt} />
                </ButtonGroup>
            )
        }
        if (browserIsSafari()) {
            return (
                <ButtonGroup>
                    <AnchorButton text={"Install Safari extension for randoplan"} href={"https://apps.apple.com/us/app/randoplan-extension/id6477252687"} />
                    <Button text="Nope" onClick={mutePrompt} />
                </ButtonGroup>
            )
        }
    }
    return null;
}