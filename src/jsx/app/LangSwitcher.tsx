import { Button, ButtonGroup } from '@blueprintjs/core';
import i18n from 'i18next'
import * as React from 'react';
import {useTranslation} from 'react-i18next'
import * as Sentry from "@sentry/react";

type language = { 'nativeName' : string}
type languages = { [languageName : string] : language}

const lngs: languages = {
  'en-US': { nativeName: 'English' },
  fr: { nativeName: 'Français' },
  es: {nativeName: 'Español'}
};

const addBreadcrumb = (msg : string) => {
    Sentry.addBreadcrumb({
        category: 'language',
        level: "info",
        message: msg
    })
}

const LangSwitcher = () => {
    const { t } = useTranslation();
    return (
        <div>
            <ButtonGroup style={{ position: 'absolute', bottom: '0px' }}>
                <Button variant='minimal' active disabled>{t('labels.language')}</Button>
                {Object.keys(lngs).map((lng) => (
                    <Button key={lng} style={{ fontWeight: i18n.language === lng ? 'bold' : 'normal' }} type="submit" 
                    onClick={() => {addBreadcrumb(`Switching to ${lng}`); i18n.changeLanguage(lng)}}>
                        {lngs[lng].nativeName}
                    </Button>
                ))}
            </ButtonGroup>
        </div>)
}

export default React.memo(LangSwitcher)