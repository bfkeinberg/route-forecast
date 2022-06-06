import { Button, ButtonGroup, AnchorButton } from "@blueprintjs/core";
import React, {useState, useEffect} from "react";
import { extensionIsInstalled, browserIsChrome, browserIsFirefox } from "../utils/extensionDetect";
import cookie from 'react-cookies';

export const InstallExtensionButton = () => {
    if (cookie.load('muteExtensionInstallPrompt')) {
        return null;
    }
    const [
        isInstalled,
        setIsInstalled
    ] = useState(undefined);

    useEffect(() => {
        const checkIfInstalled = async () => {
            setIsInstalled(await extensionIsInstalled());
        }
        checkIfInstalled();
    })

    if (isInstalled) {
        // console.info('Extension is installed');
        return null;
    }
    if (isInstalled !== undefined) {
        if (browserIsChrome()) {
            console.info('Extension not installed');
            return (
                <ButtonGroup>
                    <AnchorButton text={"Install Chrome extension for randoplan"} href={"https://chrome.google.com/webstore/detail/randoplan-extension/bgodmjchmhnpgccglldbfddddignglep"}/>
                    <Button text="Nope" onClick={()=>cookie.save('muteExtensionInstallPrompt', true, { path: '/' } )}/>
                </ButtonGroup>
            )
        }
        if (browserIsFirefox()) {
            return (
                <ButtonGroup>
                    <AnchorButton text={"Install Firefox extension for randoplan"} href={"https://addons.mozilla.org/en-US/firefox/addon/randoplan-extension/"} />
                    <Button text="Nope" onClick={() => cookie.save('muteExtensionInstallPrompt', true, { path: '/' })} />
                </ButtonGroup>
            )
        }
    }
    return null;
}