import ReactGA from "react-ga4";
import {connect} from 'react-redux';
import * as Sentry from "@sentry/react";
import type { RootState } from "../../redux/store";
import {IconArrowUpSquare, IconCopy} from "@tabler/icons-react"
import { TextInput, Notification, ActionIcon, Flex } from '@mantine/core';
import {useTranslation} from 'react-i18next'
import { notifications } from '@mantine/notifications';
import { useAppSelector, useAppDispatch } from "../../utils/hooks";
import { errorDetailsSet } from "../../redux/dialogParamsSlice";
import { shortenUrl } from "../../redux/actions";
import React from "react";
const { trace, debug, info, warn, error, fatal, fmt } = Sentry.logger;

const ShortUrl = ({ shortUrl }: { shortUrl: string }) => {
    const { t } = useTranslation()
    const errorDetails = useAppSelector(state => state.uiInfo.dialogParams.errorDetails)
    const searchString = useAppSelector(state => state.params.searchString);
    const distance = useAppSelector(state => state.routeInfo.distanceInKm)
    const dispatch = useAppDispatch()
    const [needToGetShortUrl, setNeedToGetShortUrl] = React.useState(false);
    const [copyFailed, setCopyFailed] = React.useState(false);
    const [showCopyButton, setShowCopyButton] = React.useState(false);
    const publicUrl = useAppSelector(state => state.params.queryString);

    React.useEffect(() => {
        if (needToGetShortUrl && publicUrl) {
            dispatch(shortenUrl(publicUrl));
            setNeedToGetShortUrl(false);
        }
    }, [needToGetShortUrl, publicUrl]);

    const fallbackCopyToClipboard = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;

        // Position off-screen to avoid visual disruption
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select(); // Select the text

        try {
            const successful = document.execCommand('copy'); // Execute the copy command
            if (!successful) {
                setCopyFailed(true);
                warn(`Fallback: Copying ${text} was unsuccessful`);
            }
        } catch (err) {
            Sentry.captureException(err);
        }

        document.body.removeChild(textArea); // Clean up the temporary element
    }

    const copyShortUrl = async (shortUrl: string) => {
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText((shortUrl));
                notifications.show({ message: "Short URL copied", autoClose: 3000, withCloseButton: false });
            } catch (err) {
                Sentry.captureException(err);
                fallbackCopyToClipboard(shortUrl);
                notifications.show({ message: "Short URL was copied", autoClose: 3000, withCloseButton: false });
            }
        }
        else {
            fallbackCopyToClipboard(shortUrl);
            notifications.show({ message: "Short URL was copied", autoClose: 3000, withCloseButton: false });
        }
    }    

    React.useEffect(() => {
        setShowCopyButton(shortUrl !== 'click here to get a short URL');
    }, [shortUrl]);
    
    const showErrorNotUrl = errorDetails && searchString && distance;
    const needsItalic = !shortUrl.startsWith('https');
    const textStyle = needsItalic ? { fontStyle: "italic" } : {};
    return (
        <div style={{ display: (shortUrl === ' ' && !showErrorNotUrl) ? 'none' : 'inline-flex', margin: "0px 10px", flexDirection: "column", justifyContent: "flex-start" }}>
            <div style={{ width: "150px", display: "flex", alignItems: "center" }}>
                <div>{t('labels.share')}</div>
            </div>
            {showErrorNotUrl && <Notification color='red' onClose={() => dispatch(errorDetailsSet(null))}>{errorDetails}</Notification>}
            <Flex>
            {showCopyButton && <ActionIcon onClick={() => {setCopyFailed(false); copyShortUrl(shortUrl); ReactGA.event('share', {item_id: shortUrl})}}>
                <IconCopy size={12} />
            </ActionIcon>}
            <TextInput style={textStyle} leftSection={<IconArrowUpSquare />} id={'shortUrl'} size="xs" readOnly type="text" value={shortUrl}
                onClick={async event => {
                    setNeedToGetShortUrl(true);
                }} 
                />
                </Flex>
        </div>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        shortUrl: state.uiInfo.dialogParams.shortUrl
    });

export default connect(mapStateToProps)(ShortUrl);