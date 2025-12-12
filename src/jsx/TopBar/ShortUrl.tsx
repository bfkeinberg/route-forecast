import ReactGA from "react-ga4";
import {connect} from 'react-redux';
import * as Sentry from "@sentry/react";
import type { RootState } from "../../redux/store";
import {IconArrowUpSquare} from "@tabler/icons-react"
import { TextInput, Notification } from '@mantine/core';
import {useTranslation} from 'react-i18next'
import { notifications } from '@mantine/notifications';
import { useAppSelector, useAppDispatch } from "../../utils/hooks";
import { errorDetailsSet } from "../../redux/dialogParamsSlice";

const ShortUrl = ({shortUrl} : {shortUrl:string}) => {
    const { t } = useTranslation()
    const errorDetails = useAppSelector(state => state.uiInfo.dialogParams.errorDetails)
    const searchString = useAppSelector(state => state.params.searchString);
    const distance = useAppSelector(state => state.routeInfo.distanceInKm)
    const dispatch = useAppDispatch()
    const showErrorNotUrl = errorDetails && searchString && distance;

    return (
        <div style={{ display: (shortUrl === ' ' && !showErrorNotUrl) ? 'none' : 'inline-flex', margin: "0px 10px", flexDirection:"column", justifyContent:"flex-start"}}>
            <div style={{width: "150px", display: "flex", alignItems: "center"}}>
                <div>{t('labels.share')}</div>
            </div>
            {showErrorNotUrl && <Notification color='red' onClose={() => dispatch(errorDetailsSet(null))}>{errorDetails}</Notification>}
            <TextInput leftSection={<IconArrowUpSquare/>} id={'shortUrl'} size="xs" readOnly type="text" value={shortUrl}
                   onClick={async event => {
                    if (navigator.clipboard) {
                       try {
                            await navigator.clipboard.writeText((event.target as HTMLInputElement).value);
                            notifications.show({ message: "Short URL copied", autoClose:3000, withCloseButton: false });
                       } catch (err) {
                           Sentry.captureException(err);
                           (event.target as HTMLInputElement).select();document.execCommand('copy');
                       }
                    }
                    else {
                        (event.target as HTMLInputElement).select();document.execCommand('copy');
                    }
                    ReactGA.event('share', {item_id:(event.target as HTMLInputElement).value})}}/>
        </div>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        shortUrl: state.uiInfo.dialogParams.shortUrl
    });

export default connect(mapStateToProps)(ShortUrl);