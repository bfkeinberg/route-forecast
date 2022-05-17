import { Button, ButtonGroup, AnchorButton } from "@blueprintjs/core";
import React from "react";
import { extensionIsInstalled, browserIsChrome, browserIsFirefox } from "../utils/extensionDetect";
import cookie from 'react-cookies';

export const InstallExtensionButton = () => {
    if (cookie.load('muteExtensionInstallPrompt')) {
        return null;
    }
    if (extensionIsInstalled()) {
        return null;
    }
    if (browserIsChrome()) {
        console.info('Extension not installed');
        return (/*
            <ButtonGroup>
                <AnchorButton text={"Install Chrome extension for randoplan"} href={"https://chrome.google.com/webstore/detail/randoplan-extension/bgodmjchmhnpgccglldbfddddignglep"}/>
                <Button text="Nope" onClick={()=>cookie.save('muteExtensionInstallPrompt', true, { path: '/' } )}/>
            </ButtonGroup>*/null
        )
    }
    if (browserIsFirefox()) {
        return (
            <ButtonGroup>
                <AnchorButton text={"Install Firefox extension for randoplan"} href={"https://addons.mozilla.org/en-US/firefox/addon/randoplan-extension/"}/>
                <Button text="Nope" onClick={()=>cookie.save('muteExtensionInstallPrompt', true, { path: '/' } )}/>
            </ButtonGroup>
        )
    }
    return null;
}