import { Button, ButtonGroup } from '@blueprintjs/core';
import i18n from 'i18next'
import React from 'react';
import {useTranslation} from 'react-i18next'

const lngs = {
  en: { nativeName: 'English' },
  fr: { nativeName: 'Français' }
};

const LangSwitcher = () => {
    const { t } = useTranslation();
    return (
        <div>
    <ButtonGroup style={{position:'absolute', bottom:'0px'}}>
        <Button minimal active disabled>{t('labels.language')}</Button>
        {Object.keys(lngs).map((lng) => (
            <Button key={lng} style={{ fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal' }} type="submit" onClick={() => i18n.changeLanguage(lng)}>
                {lngs[lng].nativeName}
            </Button>
        ))}
    </ButtonGroup>
    </div>)
}

export default React.memo(LangSwitcher)