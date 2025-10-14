import i18n from 'i18next'
import * as React from 'react';
import {useTranslation} from 'react-i18next'
import * as Sentry from "@sentry/react";
import { Button } from '@mantine/core';

type language = { 'nativeName' : string}
type languages = { [languageName : string] : language}

const lngs: languages = {
  'en-US': { nativeName: 'English' },
  fr: { nativeName: 'Français' },
  es: {nativeName: 'Español'},
  zh: {nativeName: '中文'}
};

const addBreadcrumb = (msg : string) => {
    Sentry.addBreadcrumb({
        category: 'language',
        level: "info",
        message: msg
    })
}

const LangSwitcher = () => {
    const { t } = useTranslation()
    return (
        <div>
            <Button.Group style={{ position: 'absolute', bottom: '0px' }}>
                <Button variant='light' size="sm" disabled>{t('labels.language')}</Button>
                {Object.keys(lngs).map((lng) => (
                    <Button key={lng} size="sm" variant="default" style={{ fontWeight: i18n.language === lng ? 'bold' : 'normal' }} type="submit" 
                    onClick={() => {addBreadcrumb(`Switching to ${lng}`); i18n.changeLanguage(lng)}}>
                        {lngs[lng].nativeName}
                    </Button>
                ))}
            </Button.Group>
        </div>)
}

export default React.memo(LangSwitcher)