import {useEffect,useState} from "react";
import cookie from 'react-cookies';
import { Button } from "@mantine/core";
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
        return null;
    }
    if (isInstalled !== undefined) {
        if (browserIsChrome()) {
            console.info('Extension not installed');
            return (
                <Button.Group>
                    <Button component="a" variant="default" href={"https://chrome.google.com/webstore/detail/randoplan-extension/bgodmjchmhnpgccglldbfddddignglep"}>Install Chrome extension for randoplan</Button>
                    <Button variant="default" onClick={mutePrompt}>Nope</Button>
                </Button.Group>
            )
        }
        if (browserIsFirefox()) {
            return (
                <Button.Group>
                    <Button component="a" variant="default" href={"https://addons.mozilla.org/en-US/firefox/addon/randoplan-extension/"}>Install Firefox extension for randoplan</Button>
                    <Button variant="default" onClick={mutePrompt}>Nope</Button>
                </Button.Group>
            )
        }
        if (browserIsSafari()) {
            return (
                <Button.Group>
                    <Button component="a" variant="default" href={"https://apps.apple.com/us/app/randoplan-extension/id6477252687"}>Install Safari extension for randoplan</Button>
                    <Button variant="default" onClick={mutePrompt}>Nope</Button>
                </Button.Group>
            )
        }
    }
    return null;
}