import {Classes, DrawerSize} from "@blueprintjs/core"
import faq from "../../static/faq.htm"
import React, {useState} from "react"
import { Drawer } from "@blueprintjs/core"
import Typography from "@mui/material/Typography"
import cookie from 'react-cookies';
import  {useMediaQuery} from 'react-responsive'

const FaqImage = ({flash} : {flash:boolean}) => {
    const textClass = flash ? "flashing-red-text" : ""
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 50 30'>
            <text fill="none"  strokeWidth={1} paintOrder="stroke" y={20} stroke="#0066ff"
             fontFamily="sans-serif" fontSize={18}  fontWeight="bold" className={textClass}>FAQ</text>
        </svg>
    )
}

const FaqButton = () => {
    const [faqVisible, setFaqVisible] = useState(false)
    const showFaq = () => {
        cookie.save('clickedFaq', "true", { path: '/' }); 
        setFaqVisible(true)
    }

    const hideFaq = () => {
        setFaqVisible(false)
    }
    const faqWasClicked = cookie.load('clickedFaq')
    const isMobile = useMediaQuery({query:'(max-width: 600px)'})
    const drawerSize = isMobile? DrawerSize.LARGE : DrawerSize.STANDARD

    return (
        <>
            <button style={{border:'none', backgroundColor: 'transparent', width:"90px", height:"60px"}} onClick={showFaq}>
                <FaqImage flash={!faqWasClicked}/>
            </button>
            <Drawer size={drawerSize} style={{overflowY: 'scroll'}} className={Classes.OVERLAY_SCROLL_CONTAINER} onClose={hideFaq} title={"Randoplan FAQ"} isOpen={faqVisible}>
                <Typography dangerouslySetInnerHTML={{__html:faq}}/>
            </Drawer>
        </>
    )
}

export default React.memo(FaqButton)