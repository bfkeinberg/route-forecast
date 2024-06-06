import { Button, Classes} from "@blueprintjs/core"
import  faq from "../../static/faq.htm"
import React, {useState} from "react"
import { Drawer } from "@blueprintjs/core"
import Typography from "@mui/material/Typography"

const FaqImage = () => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox='0 0 50 30'>
            <text fill="none"  strokeWidth={1} paintOrder="stroke" y={20} stroke="#0066ff" fontFamily="sans-serif" fontSize={18}  fontWeight="bold" >FAQ</text>
        </svg>
    )
}

//filter="url(#outline)" 
const FaqButton = () => {
    const [faqVisible, setFaqVisible] = useState(false)
    const showFaq = () => {
        setFaqVisible(true)
    }

    const hideFaq = () => {
        setFaqVisible(false)
    }

    return (
        <>
            <button style={{border:'none', backgroundColor: 'transparent', width:"90px", height:"60px"}} onClick={showFaq}>
                <FaqImage/>
            </button>
            <Drawer style={{overflowY: 'scroll'}} className={Classes.OVERLAY_SCROLL_CONTAINER} onClose={hideFaq} title={"Randoplan FAQ"} isOpen={faqVisible}>
                <Typography dangerouslySetInnerHTML={{__html:faq}}/>
            </Drawer>
        </>
    )
}

export default React.memo(FaqButton)